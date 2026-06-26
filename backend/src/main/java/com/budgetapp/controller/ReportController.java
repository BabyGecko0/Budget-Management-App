package com.budgetapp.controller;

import com.budgetapp.config.CustomUserDetails;
import com.budgetapp.dto.response.SummaryResponse;
import com.budgetapp.dto.response.TrendPoint;
import com.budgetapp.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<SummaryResponse> getMonthlySummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @AuthenticationPrincipal CustomUserDetails principal) {
        int m = month != null ? month : LocalDate.now().getMonthValue();
        int y = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(reportService.getMonthlySummary(principal.getUserId(), m, y));
    }

    @GetMapping("/trend")
    public ResponseEntity<List<TrendPoint>> getTrend(
            @RequestParam(defaultValue = "6") int months,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(reportService.getTrend(principal.getUserId(), months));
    }
}
