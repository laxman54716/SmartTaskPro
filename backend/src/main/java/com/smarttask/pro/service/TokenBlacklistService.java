package com.smarttask.pro.service;

import com.smarttask.pro.model.entity.TokenBlacklist;
import com.smarttask.pro.repository.TokenBlacklistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenBlacklistService {

    private final TokenBlacklistRepository tokenBlacklistRepository;

    public void blacklistToken(String token) {
        if (!tokenBlacklistRepository.existsByToken(token)) {
            TokenBlacklist blacklisted = TokenBlacklist.builder()
                    .token(token)
                    .build();
            tokenBlacklistRepository.save(blacklisted);
        }
    }

    public boolean isTokenBlacklisted(String token) {
        return tokenBlacklistRepository.existsByToken(token);
    }
}
