package com.budgetapp.service;

import com.budgetapp.dto.request.UserProfileRequest;
import com.budgetapp.dto.response.UserProfileResponse;
import com.budgetapp.entity.User;
import com.budgetapp.exception.ResourceNotFoundException;
import com.budgetapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(Long userId) {
        return UserProfileResponse.from(findUser(userId));
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UserProfileRequest req) {
        User user = findUser(userId);
        user.setDisplayName(req.displayName());
        user.setCurrency(req.currency());
        user.setMonthlyIncome(req.monthlyIncome());
        userRepository.save(user);
        log.info("Updated profile for user: {}", user.getEmail());
        return UserProfileResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
