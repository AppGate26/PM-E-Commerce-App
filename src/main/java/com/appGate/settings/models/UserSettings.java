package com.appGate.settings.models;

import com.appGate.rbac.models.BaseEntity;
import com.appGate.settings.enums.CurrencyEnum;
import com.appGate.settings.enums.LanguageEnum;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "user_settings")
public class UserSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "language")
    private LanguageEnum language = LanguageEnum.ENGLISH;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency")
    private CurrencyEnum currency = CurrencyEnum.NGN;
}
