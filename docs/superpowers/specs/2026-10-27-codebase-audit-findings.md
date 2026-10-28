# Codebase Audit Remediation Specification

## Overview
Remediation of high and medium priority defects identified during the repository audit across the ASP.NET Core 9 backend and Next.js 14 frontend.

## Goals
1. Prevent foreign key crashes when users delete routine days that already have associated workout history.
2. Normalize service validation exceptions and prevent unhandled 500 crashes on invalid user input.
3. Keep routine metrics (`DaysPerWeek`) in sync with database reality.
4. Auto-close abandoned workout sessions to prevent orphaned active session accumulation.
5. Remediate known vulnerable dependencies (`System.Security.Cryptography.Pkcs` 9.0.0).
6. Enable frontend users to see real validation error messages rather than generic error fallbacks.
7. Guarantee live session synchronization and allow flexible bonus/drop sets in the active workout logger.
8. Protect authenticated users from being erroneously thrown into onboarding during transient connection errors.

## Non-Goals
- Altering core database schema or running migrations that break backward compatibility.
- Changing the established Warm Editorial design system or visual theme.
