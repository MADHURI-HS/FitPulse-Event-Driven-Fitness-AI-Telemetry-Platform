package com.fitness.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Validates JWTs issued by userservice. Previously the gateway validated
 * tokens against Keycloak's public JWK set (spring-boot-starter-oauth2-resource-server,
 * jwk-set-uri pointing at the Keycloak realm). Now there's no external
 * identity provider - both this class and userservice's JwtUtil share the
 * same HMAC secret (jwt.secret, injected via the config server), so the
 * gateway can verify a token's signature itself with no network call.
 */
@Component
public class JwtUtil {

    private final SecretKey secretKey;

    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Returns the userId (subject claim) if the token is valid and unexpired.
     * Returns null if the token is missing, malformed, expired, or has a bad signature.
     */
    public String validateAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return claims.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
