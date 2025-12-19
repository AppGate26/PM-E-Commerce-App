package com.appGate.rbac.util;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Date;

import javax.crypto.SecretKey;

import com.appGate.rbac.dto.UserDto;
import com.appGate.rbac.models.CustomUserDetailImpl;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

@Component
public class JwtUtils {


  private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);
  
  private final UserRepository userRepository;
  private final String jwtSecret;
  private final int jwtExpirationMs;
  private final String jwtCookie;

  public JwtUtils(
      UserRepository userRepository,
      @Value("${app.jwtSecret}") String jwtSecret,
      @Value("${app.jwtExpirationMs}") int jwtExpirationMs,
      @Value("${app.jwtCookieName}") String jwtCookie) {
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpirationMs = jwtExpirationMs;
    this.jwtCookie = jwtCookie;
  }

  public String getJwtFromCookies(HttpServletRequest request) {
    Cookie cookie = WebUtils.getCookie(request, jwtCookie);
    if (cookie != null) {
      return cookie.getValue();
    } else {
      return null;
    }
  }

  public ResponseCookie generateJwtCookie(CustomUserDetailImpl userPrincipal) {
    return ResponseCookie.from(jwtCookie,
        generateTokenFromEmail(userPrincipal.getEmail())).path("/api")
        .maxAge(24L * 60 * 60).httpOnly(true)
        .build();
  }

  public ResponseCookie getCleanJwtCookie() {
    return ResponseCookie.from(jwtCookie, null).path("/api").build();
  }

  public String getUserNameFromJwtToken(String token) {
    return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getSubject();
  }

  private SecretKey getSigningKey() {
    byte[] keyBytes = this.jwtSecret.getBytes(StandardCharsets.UTF_16);
    return Keys.hmacShaKeyFor(keyBytes);
  }

  public boolean validateJwtToken(String authToken) throws SignatureException, MalformedJwtException,
      ExpiredJwtException, UnsupportedJwtException, IllegalArgumentException {
    try {
      Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);

      return true;
    } catch (MalformedJwtException e) {
      logger.error("Invalid JWT token: {}", e.getMessage());
    } catch (ExpiredJwtException e) {
      logger.error("JWT token is expired: {}", e.getMessage());
    } catch (UnsupportedJwtException e) {
      logger.error("JWT token is unsupported: {}", e.getMessage());
    } catch (IllegalArgumentException e) {
      logger.error("JWT claims string is empty: {}", e.getMessage());
    }
    return false;
  }

  public String extractEmail(String token) {
    return extractClaims(token).getSubject();
  }

  public Claims extractClaims(String token) {
    return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getBody();
  }
  public String extractRole(String token) {
    return extractClaims(token).get("role", String.class);
  }

   public String generateTokenFromEmail(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("User not found"));

        return Jwts.builder()
         .setSubject(email)
         .setIssuedAt(new Date())
         .claim("id", user.getId())
         .claim("firstname", user.getFirstName())
         .claim("lastname", user.getLastName())
         .claim("email", user.getEmail())
         .claim("role", user.getRole().name())
         .claim("authorities", Collections.singletonList("ROLE_" + user.getRole().name()))
         .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
         .signWith(getSigningKey())
         .compact();
   }


   public String getExpiringDateFromToken(String token) {
    return extractClaims(token).getExpiration().toString();
   }

  public String generateJwtRefreshToken(String username) {
    return Jwts.builder()
        .subject(username)
        .issuedAt(new Date())
        .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(getSigningKey())
        .compact();
  }

  public String generateJwtToken(String username) {
    return Jwts.builder()
        .subject(username)
        .issuedAt(new Date())
        .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(getSigningKey())
        .compact();
  }

  public String generateTokenLdap(UserDto user) {
    return Jwts.builder()
        .setSubject(user.getEmail())
        .setIssuedAt(new Date())
        .claim("firstname", user.getFirstName())
        .claim("lastname", user.getLastName())
        .claim("email", user.getEmail())
        .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
        .signWith(getSigningKey())
        .compact();
  }
}