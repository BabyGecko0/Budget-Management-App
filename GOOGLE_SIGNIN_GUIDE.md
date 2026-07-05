# Google Sign-In — Service & Controller Guide

Tailored to your existing `budget-app-backend` (Spring Boot 3.4.5, JWT auth, H2 file DB).

## How the flow works

Your frontend uses **Google Identity Services** to get the user signed in with Google. Google gives the frontend a signed **ID token** (a JWT, not an OAuth access token). The frontend sends that ID token to your backend. Your backend verifies the signature with Google's public keys (using just your **Client ID**, no client secret needed) and pulls the user's email, name, and Google account ID (`sub`) out of it. From there you find-or-create a local `User` row and issue your **own** JWT, exactly like `login()` does today. Nothing about your existing JWT/session handling changes — Google only replaces the "prove who you are" step.

## 1. Add the dependency

`backend/pom.xml`:

```xml
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.7.0</version>
</dependency>
```

## 2. Add the client ID to config

`backend/src/main/resources/application.yml`:

```yaml
google:
  client-id: ${GOOGLE_CLIENT_ID:}
```

Get this value from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID. Set the actual value via the `GOOGLE_CLIENT_ID` env var, not committed to the repo.

## 3. Update the `User` entity

`entity/User.java` — Google users won't have a password, and you need somewhere to store their Google account ID:

```java
@Column
private String passwordHash; // remove nullable = false — Google users won't have one

@Column(unique = true)
private String googleId;

@Enumerated(EnumType.STRING)
private AuthProvider authProvider = AuthProvider.LOCAL;
```

New enum, `entity/enums/AuthProvider.java`:

```java
package com.budgetapp.entity.enums;

public enum AuthProvider {
    LOCAL, GOOGLE
}
```

Since `ddl-auto: update` is set, H2 will add these columns automatically on next startup — no manual migration needed.

## 4. Add a repository lookup

`repository/UserRepository.java` — add one method:

```java
Optional<User> findByGoogleId(String googleId);
```

## 5. New request DTO

`dto/request/GoogleLoginRequest.java`:

```java
package com.budgetapp.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
        @NotBlank String idToken
) {}
```

## 6. Token verifier component

New file, `service/GoogleTokenVerifier.java` — isolates the Google-specific verification logic:

```java
package com.budgetapp.service;

import com.budgetapp.exception.BadRequestException;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Component
@Slf4j
public class GoogleTokenVerifier {

    @Value("${google.client-id}")
    private String googleClientId;

    private GoogleIdTokenVerifier verifier;

    private GoogleIdTokenVerifier verifierInstance() {
        if (verifier == null) {
            verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
        }
        return verifier;
    }

    public GoogleIdToken.Payload verify(String idTokenString) {
        try {
            GoogleIdToken idToken = verifierInstance().verify(idTokenString);
            if (idToken == null) {
                throw new BadRequestException("Invalid Google ID token");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new BadRequestException("Google email not verified");
            }
            return payload;
        } catch (GeneralSecurityException | IOException e) {
            log.error("Failed to verify Google ID token", e);
            throw new BadRequestException("Could not verify Google ID token");
        }
    }
}
```

## 7. Service method

`service/AuthService.java` — add the verifier as a dependency and a new method, following the same pattern as `login()`:

```java
private final GoogleTokenVerifier googleTokenVerifier; // add to constructor deps

@Transactional
public AuthResponse loginWithGoogle(GoogleLoginRequest req) {
    GoogleIdToken.Payload payload = googleTokenVerifier.verify(req.idToken());

    String googleId = payload.getSubject();
    String email = payload.getEmail();
    String name = (String) payload.get("name");

    User user = userRepository.findByGoogleId(googleId)
            .or(() -> userRepository.findByEmail(email))
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setDisplayName(name);
                newUser.setAuthProvider(AuthProvider.GOOGLE);
                newUser.setGoogleId(googleId);
                userRepository.save(newUser);
                categoryService.seedDefaultCategories(newUser);
                log.info("Registered new Google user: {}", email);
                return newUser;
            });

    // account existed via email/password — link the Google identity to it
    if (user.getGoogleId() == null) {
        user.setGoogleId(googleId);
        user.setAuthProvider(AuthProvider.GOOGLE);
        userRepository.save(user);
    }

    log.info("User logged in via Google: {}", user.getEmail());
    String token = jwtUtil.generateToken(user.getEmail());
    return new AuthResponse(token, user.getEmail(), user.getDisplayName(), user.getCurrency());
}
```

Add the matching import: `com.google.api.client.googleapis.auth.oauth2.GoogleIdToken` and `com.budgetapp.entity.enums.AuthProvider`.

Note the account-linking behavior above: if someone registered with email/password first and later signs in with Google using the same email, this attaches their Google ID to the existing account rather than creating a duplicate. Decide if that's the behavior you want — some apps instead reject this case and ask the user to log in with their original method.

## 8. Controller endpoint

`controller/AuthController.java` — one new endpoint, same shape as the others:

```java
@PostMapping("/google")
public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest req) {
    return ResponseEntity.ok(authService.loginWithGoogle(req));
}
```

## 9. Security config

No change needed — `SecurityConfig` already permits everything under `/api/auth/**`, so `/api/auth/google` is covered.

## Testing it

You can't easily fake a valid Google ID token with curl. Simplest way to get a real one to test against:

1. Create a throwaway HTML page that loads Google Identity Services (`https://accounts.google.com/gsi/client`) with your Client ID, sign in, and `console.log` the `credential` field from the callback response — that's the ID token.
2. POST it manually:

```bash
curl -X POST http://localhost:8085/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "<paste token here>"}'
```

You should get back the same `AuthResponse` shape as `/login` — a JWT plus email/displayName/currency — which your existing `JwtAuthFilter` will accept unchanged on subsequent requests.
