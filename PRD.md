Of course. Based on the provided route structure, here is a detailed Product Requirements Document (PRD) in Markdown format. The routes describe a sophisticated financial platform, likely for private equity or alternative investment fund administration.

---

# **PRD: Fund Administration & Portfolio Management Platform**

*   **Version:** 1.0
*   **Status:** Draft
*   **Author:** Product Team
*   **Date:** October 26, 2023

## 1. Introduction & Vision

This document outlines the product requirements for a comprehensive, web-based platform designed for the administration and management of investment fund families. The platform will serve as a single source of truth for fund managers, administrators, and operations teams, enabling them to manage the entire fund lifecycle, from initial setup and configuration to ongoing capital activity, complex fee calculations, and detailed financial reporting.

The vision is to create a powerful, scalable, and auditable system that automates complex financial workflows, reduces operational risk, and provides deep insights into fund and investor performance.

## 2. Target Audience & Personas

*   **Fund Administrator / Accountant:** The primary user, responsible for day-to-day operations, including processing capital calls and distributions, calculating fees, managing the general ledger, and generating reports.
*   **General Partner (GP) / Fund Manager:** Oversees fund performance, makes investment decisions, and requires high-level dashboards and detailed reporting on fund health, investor commitments, and portfolio activity.
*   **Internal Operations / Provisioning Team:** Responsible for onboarding new customers (funds), managing platform features, and ensuring system integrity through testing and monitoring.
*   **Compliance Officer:** Needs access to auditable records of all transactions, events, and configuration changes.

## 3. High-Level Goals

*   **Centralize Fund Data:** Consolidate all information related to fund structures, entities, investors, commitments, and transactions.
*   **Automate Complex Workflows:** Streamline and automate critical processes like capital calls, distributions, waterfall calculations, fee management, and closings.
*   **Ensure Accuracy & Auditability:** Provide transparent, step-by-step calculation breakdowns and maintain a complete history of events and changes.
*   **Enhance Reporting & Analytics:** Deliver flexible and powerful reporting capabilities, from standard financial reports to custom pivot tables.
*   **Provide Robust Configuration:** Allow for the detailed and flexible setup of fund-specific rules, including fees, waterfalls, and allocation logic.

## 4. Detailed Functionality (Feature Breakdown)

This section maps the application's features directly to the route structure.

### 4.1. Core Application & User Experience

*   **Dashboard (`/dashboard`):** The main landing page for authenticated users, providing a high-level overview, key metrics, and quick access to different modules.
*   **Authentication & Security (`/auth`):**
    *   **User Login/Logout:** Standard and simple login flows (`/auth/login`, `/auth/login/simple`, `/auth/logout`).
    *   **Password Management:** Secure password setup for new users (`/auth/password/setup`) and a self-service reset flow (`/auth/password/reset`).
    *   **Multi-Factor Authentication (MFA):** A dedicated flow for setting up and verifying MFA (`/auth/mfa/setup`, `/auth/mfa`).
*   **User Account Management (`/account`):**
    *   **Profile Management:** Users can view and edit their personal profile information.
    *   **Security Settings:** Users can manage their security settings, such as changing their password or MFA configuration (`/account/security`).

### 4.2. Fund Family Management (`/fund-family/:fundFamilyId`)

This is the core module where users manage a specific fund family.

#### 4.2.1. Fund Family Overview
*   **Fund Family List (`/fund-family`):** A landing page listing all accessible fund families.
*   **Summary Dashboard (`/fund-family/:fundFamilyId/summary`):** A dashboard for the selected fund family, showing key performance indicators, recent activity, and quick stats.

#### 4.2.2. Capital Activity (`/capital-activity`)
This section handles all financial events related to the movement of capital.
*   **Event Dashboard:** An overview of all capital activity events.
*   **Event-Specific Workflows (`/capital-activity/:fundFamilyEventId`):**
    *   **Capital Calls (`/calls`):**
        *   Manage capital call allocations.
        *   View a detailed overview and investor-level breakdown.
        *   **Reallocation Workflow:** A multi-step process to reallocate a capital call (`/reallocation/:reallocationFundFamilyEventId`), including an overview, update screen, and review step.
    *   **Distributions (`/distribution`):**
        *   Manage distribution event allocations.
        *   View a detailed overview and investor-level breakdown.
    *   **Equalizations (`/equalization`):** View details of equalization sub-events.
    *   **Waterfall Calculations (`/waterfall`):**
        *   **Review Waterfall:** A comprehensive review screen (`/review/:fundFamilySubEventId`) for a calculated waterfall, with drill-downs for:
            *   Fund Preferred Return details.
            *   Tier-level audits for full transparency.
        *   **Hybrid Waterfall Workflow:** A dedicated workflow for complex hybrid waterfalls (`/hybrid/:fundFamilySubEventId`) with separate input steps for required paydowns, accelerated paydowns, and fund expenses, followed by a final review.

#### 4.2.3. Commitments & Investors (`/commitments`)
*   **Commitment Dashboard:** A tabbed interface to view all commitments, closings (`/closings`), and investor transfers (`/transfers`).
*   **Commitment-Level View (`/commitments/:commitmentId`):** Drill down into a specific commitment to see its:
    *   Activity
    *   Performance
    *   Associated Fees
    *   Waterfall details
    *   Profile information
*   **Investor Entity View (`/commitments/investor-entities/:investorEntityId`):** A dedicated view for an investor entity, with tabs for its activity, performance, commitments, and profile.
*   **Cancel/Correct Workflow (`/cancel-correct/...`):** A critical feature to cancel and correct a historical event for a specific commitment, handling corrections for class, fee true-ups, and equalizations.

#### 4.2.4. Investor Transfers (`/investor-transfers`)
*   A dedicated module to manage the transfer of commitments between investors.
*   **Creation Wizard (`/setup/:investorTransferId`):** A guided, multi-step workflow to set up a new transfer:
    1.  Enter Details
    2.  Define Transferees
    3.  Upload Documents
    4.  Review
    5.  Finalize

#### 4.2.5. Closings (`/closing`)
*   A module for managing fund closings.
*   **Closing Wizard (`/:closingId/edit`):** A multi-step workflow to define and review a closing event, covering:
    *   Commitments
    *   Allocation Rules
    *   Capital & Non-Capital Equalization
    *   Fee True-Ups
    *   Final Review of all components.
*   **View Closing (`/:closingId/view`):** A read-only view of a finalized closing event.

#### 4.2.6. Credit Facilities (`/credit-facility`)
*   Manage fund credit lines and associated events.
*   **Facility Dashboard (`/:creditFacilityId`):** View details on a credit facility's principal, expenses, fees, and borrowing base.
*   **Setup Wizard (`/setup`):** Configure a new credit facility, including its details, commitments, loan terms, and borrowing base groups.
*   **Event Workflows:**
    *   **Drawdown/Paydown (`/drawdown`, `/paydown`):** Multi-step workflows to process drawdowns and paydowns, each with an update and review step.
    *   **Reallocation (`/reallocation`):** A workflow to reallocate balances.
    *   **Fee/Expense Events (`/expenses`, `/unused-fees`):** Manage the calculation and allocation of expenses and fees related to the credit facility.

#### 4.2.7. Fee Management (`/fees`)
*   A comprehensive module for calculating, posting, and reviewing management and other fees.
*   **Fee Dashboard:** A central view with tabs for postings, basis, and offsets/waivers.
*   **Fee Posting Workflow (`/post/:feeChargeEventId`):** A guided process to post fees:
    1.  Review Basis (with historical true-up and investor breakdown views).
    2.  Apply Offsets.
    3.  Apply Waivers.
    4.  Final Review.
*   **Posted Fee Breakdown (`/:feeChargeEventId/posted`):** View detailed breakdowns of posted fees by investor, by use, and for special cases like catch-ups or cancel/correct adjustments.

#### 4.2.8. Financial Reporting (`/financial-reporting`)
*   Generate hypothetical financial reports.
*   **Hypothetical Waterfall Creation (`/hypo/create-workflow`):** A guided workflow to create hypothetical scenarios:
    1.  Provide Input.
    2.  Provide Investment-specific Input.
    3.  Review.
    4.  (Optional) Designate Protected Carry.
*   **Hypothetical Waterfall Review (`/:endOfPeriodReportId/hypothetical-waterfall/...`):** A detailed review page for a generated report, including performance (IRR), waterfall details, tier audits, and PCAP summaries.

### 4.3. Global Modules & Settings

#### 4.3.1. Global Views
*   **Entities (`/entities`):** A global directory of all legal entities (funds, investors, etc.) with create and bulk-add functionality.
*   **Investors (`/investors`):** A global directory of all investors, with drill-downs to see an investor's overall activity, performance, and profile across all funds.
*   **Investments (`/investments`):** A global directory of all portfolio investments.
*   **Reports (`/reports`):** A central repository for all available system and custom-generated reports.
*   **Pivots (`/pivots`):** A powerful data analysis tool allowing users to create and view custom data tables from raw transaction data.

#### 4.3.2. General Ledger (`/general-ledger`)
*   Manage integrations with external General Ledger systems.
*   **Integration Dashboard (`/:integrationId`):** View the profile, journal entries, and cash flow for a specific GL integration.
*   **Import Events:** Functionality to import events to generate GL entries.

#### 4.3.3. System Settings (`/settings`)
*   **User Management:** Admins can manage system users.
*   **Custom Fields:** Admins can define custom data fields to extend the system's data model.

### 4.4. Fund Setup & Configuration (`/fund-family/:fundFamilyId/configuration`)

This section is for the initial setup and ongoing maintenance of a fund family's rules and structure.

*   **Fund Profile & Structure:** Define the fund's basic profile, key dates, and legal structure (`/fund`, `/structure`).
*   **Classes (`/classes`):** Define and configure different investor classes, each with its own specific fee and waterfall rules.
*   **Transaction & Calculation Logic:**
    *   **Transaction Codes (`/transaction-codes`):** Manage the chart of accounts.
    *   **Calculations (`/calculations`):** A powerful editor (including a language like MXL) for creating and managing custom transaction calculation logic.
*   **Allocation Rules (`/structure/rule/...`):** A visual or rule-based editor to create complex allocation rule graphs.
*   **Notices (`/notices`):** Configure templates for capital call and distribution notices.

### 4.5. Internal / Operational Tools (`/internal`)

This module is intended for the platform's internal operations and engineering teams.

*   **Provisioning (`/provisioning`):** A super-admin tool to manage customers (tenants), users, and "shadow" data runs for testing.
*   **Feature Flags (`/feature-flags`):** A UI to enable or disable features for specific customers or globally.
*   **Eventing (`/eventing`):** Tools for managing the import, export, and loading of event data via templates.
*   **Integration Testing (`/integration-testing`):** A comprehensive suite for running automated tests, viewing detailed reports, comparing transactions, and debugging issues.
*   **Auditing (`/auditing`):** Internal logs and audit trails.
<<<<<<< HEAD
=======

---
>>>>>>> 000b3fd (updates)
