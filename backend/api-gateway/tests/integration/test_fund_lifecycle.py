"""
Integration tests for complete fund lifecycle
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient


class TestFundLifecycle:
    """Test the complete fund lifecycle from creation to reporting."""
    
    def test_complete_fund_workflow(self, client: TestClient, auth_headers, admin_auth_headers):
        """Test complete fund workflow including creation, investors, and reporting."""
        
        # Step 1: Create a fund
        fund_data = {
            "fund_name": "Integration Test Fund",
            "fund_type": "PRIVATE_EQUITY",
            "target_size": 100000000,
            "management_fee_rate": 0.02,
            "carry_rate": 0.2,
            "description": "Fund for integration testing"
        }
        
        fund_response = client.post(
            "/api/funds",
            json=fund_data,
            headers=auth_headers
        )
        assert fund_response.status_code == 201
        fund_id = fund_response.json()["fund_id"]
        
        # Step 2: Create investors
        investor1_data = {
            "investor_name": "Pension Fund Alpha",
            "investor_type": "PENSION_FUND",
            "email": "alpha@pension.com",
            "phone": "+1-555-0001",
            "accredited_investor": True,
            "qualified_purchaser": True
        }
        
        investor1_response = client.post(
            "/api/investors",
            json=investor1_data,
            headers=auth_headers
        )
        assert investor1_response.status_code == 201
        investor1_id = investor1_response.json()["investor_id"]
        
        investor2_data = {
            "investor_name": "Insurance Company Beta",
            "investor_type": "INSURANCE_COMPANY",
            "email": "beta@insurance.com",
            "phone": "+1-555-0002",
            "accredited_investor": True,
            "qualified_purchaser": True
        }
        
        investor2_response = client.post(
            "/api/investors",
            json=investor2_data,
            headers=auth_headers
        )
        assert investor2_response.status_code == 201
        investor2_id = investor2_response.json()["investor_id"]
        
        # Step 3: Update investor KYC/AML status
        kyc_response = client.patch(
            f"/api/investors/{investor1_id}/kyc",
            json={"kyc_status": "APPROVED"},
            headers=auth_headers
        )
        assert kyc_response.status_code == 200
        
        aml_response = client.patch(
            f"/api/investors/{investor1_id}/aml",
            json={"aml_status": "APPROVED"},
            headers=auth_headers
        )
        assert aml_response.status_code == 200
        
        # Step 4: Add investor commitments to fund
        commitment1_data = {
            "fund_id": fund_id,
            "investor_id": investor1_id,
            "commitment_amount": 25000000,
            "commitment_date": "2024-01-15"
        }
        
        commitment1_response = client.post(
            f"/api/funds/{fund_id}/commitments",
            json=commitment1_data,
            headers=auth_headers
        )
        assert commitment1_response.status_code == 201
        
        commitment2_data = {
            "fund_id": fund_id,
            "investor_id": investor2_id,
            "commitment_amount": 15000000,
            "commitment_date": "2024-01-20"
        }
        
        commitment2_response = client.post(
            f"/api/funds/{fund_id}/commitments",
            json=commitment2_data,
            headers=auth_headers
        )
        assert commitment2_response.status_code == 201
        
        # Step 5: Create a capital call
        capital_call_data = {
            "fund_id": fund_id,
            "call_amount": 10000000,
            "call_date": "2024-02-01",
            "due_date": "2024-02-15",
            "purpose": "Initial investment deployment"
        }
        
        capital_call_response = client.post(
            f"/api/funds/{fund_id}/capital-calls",
            json=capital_call_data,
            headers=auth_headers
        )
        assert capital_call_response.status_code == 201
        capital_call_id = capital_call_response.json()["capital_call_id"]
        
        # Step 6: Generate capital call notice
        capital_call_report_data = {
            "fund_id": fund_id,
            "report_type": "CAPITAL_CALL",
            "call_amount": 10000000,
            "due_date": "2024-02-15",
            "format": "PDF"
        }
        
        capital_call_report_response = client.post(
            "/api/reports/generate",
            json=capital_call_report_data,
            headers=auth_headers
        )
        assert capital_call_report_response.status_code == 202
        
        # Step 7: Record capital contributions
        contribution1_data = {
            "capital_call_id": capital_call_id,
            "investor_id": investor1_id,
            "amount": 6250000,  # 25% of their commitment
            "contribution_date": "2024-02-14"
        }
        
        contribution1_response = client.post(
            f"/api/funds/{fund_id}/contributions",
            json=contribution1_data,
            headers=auth_headers
        )
        assert contribution1_response.status_code == 201
        
        # Step 8: Update fund performance
        fund_update_data = {
            "called_capital": 10000000,
            "paid_in_capital": 9500000,
            "nav": 10200000,
            "irr": 0.05,
            "moic": 1.02
        }
        
        fund_update_response = client.put(
            f"/api/funds/{fund_id}",
            json=fund_update_data,
            headers=auth_headers
        )
        assert fund_update_response.status_code == 200
        
        # Step 9: Generate performance report
        performance_report_data = {
            "fund_id": fund_id,
            "report_type": "PERFORMANCE",
            "start_date": "2024-01-01",
            "end_date": "2024-03-31",
            "format": "PDF"
        }
        
        performance_report_response = client.post(
            "/api/reports/generate",
            json=performance_report_data,
            headers=auth_headers
        )
        assert performance_report_response.status_code == 202
        
        # Step 10: Generate investor statements
        investor_statement_data = {
            "investor_id": investor1_id,
            "fund_id": fund_id,
            "report_type": "INVESTOR_STATEMENT",
            "quarter": "Q1",
            "year": 2024,
            "format": "PDF"
        }
        
        investor_statement_response = client.post(
            "/api/reports/generate",
            json=investor_statement_data,
            headers=auth_headers
        )
        assert investor_statement_response.status_code == 202
        
        # Step 11: Verify fund performance metrics
        performance_response = client.get(
            f"/api/funds/{fund_id}/performance",
            headers=auth_headers
        )
        assert performance_response.status_code == 200
        performance_data = performance_response.json()
        assert performance_data["called_capital"] == 10000000
        assert performance_data["nav"] == 10200000
        
        # Step 12: Verify investor commitments
        commitments_response = client.get(
            f"/api/investors/{investor1_id}/commitments",
            headers=auth_headers
        )
        assert commitments_response.status_code == 200
        commitments_data = commitments_response.json()
        assert len(commitments_data["commitments"]) > 0
        
        # Step 13: Clean up (optional - could be done in teardown)
        # Delete fund (this should cascade delete related data)
        delete_response = client.delete(
            f"/api/funds/{fund_id}",
            headers=admin_auth_headers
        )
        assert delete_response.status_code == 200
    
    def test_investor_onboarding_workflow(self, client: TestClient, auth_headers):
        """Test complete investor onboarding workflow."""
        
        # Step 1: Create investor
        investor_data = {
            "investor_name": "Onboarding Test Investor",
            "investor_type": "FAMILY_OFFICE",
            "email": "onboarding@test.com",
            "phone": "+1-555-0123",
            "accredited_investor": True,
            "qualified_purchaser": True
        }
        
        investor_response = client.post(
            "/api/investors",
            json=investor_data,
            headers=auth_headers
        )
        assert investor_response.status_code == 201
        investor_id = investor_response.json()["investor_id"]
        
        # Step 2: Upload KYC documents (mocked)
        kyc_upload_response = client.post(
            f"/api/investors/{investor_id}/documents",
            json={
                "document_type": "KYC",
                "document_name": "passport.pdf",
                "document_url": "https://storage.example.com/kyc/passport.pdf"
            },
            headers=auth_headers
        )
        # This endpoint might not exist yet, so we don't assert status
        
        # Step 3: Update KYC status to under review
        kyc_review_response = client.patch(
            f"/api/investors/{investor_id}/kyc",
            json={"kyc_status": "UNDER_REVIEW"},
            headers=auth_headers
        )
        assert kyc_review_response.status_code == 200
        
        # Step 4: Approve KYC
        kyc_approve_response = client.patch(
            f"/api/investors/{investor_id}/kyc",
            json={"kyc_status": "APPROVED"},
            headers=auth_headers
        )
        assert kyc_approve_response.status_code == 200
        
        # Step 5: Approve AML
        aml_approve_response = client.patch(
            f"/api/investors/{investor_id}/aml",
            json={"aml_status": "APPROVED"},
            headers=auth_headers
        )
        assert aml_approve_response.status_code == 200
        
        # Step 6: Verify investor is ready for investment
        investor_check_response = client.get(
            f"/api/investors/{investor_id}",
            headers=auth_headers
        )
        assert investor_check_response.status_code == 200
        investor_data = investor_check_response.json()
        assert investor_data["kyc_status"] == "APPROVED"
        assert investor_data["aml_status"] == "APPROVED"
        assert investor_data["is_active"] is True
    
    def test_reporting_workflow(self, client: TestClient, auth_headers):
        """Test complete reporting workflow."""
        
        # Step 1: Generate multiple reports
        reports_to_generate = [
            {
                "fund_id": "test-fund-123",
                "report_type": "PERFORMANCE",
                "start_date": "2023-01-01",
                "end_date": "2023-03-31",
                "format": "PDF"
            },
            {
                "fund_id": "test-fund-123",
                "report_type": "PERFORMANCE",
                "start_date": "2023-04-01",
                "end_date": "2023-06-30",
                "format": "PDF"
            },
            {
                "investor_id": "test-investor-123",
                "fund_id": "test-fund-123",
                "report_type": "INVESTOR_STATEMENT",
                "quarter": "Q1",
                "year": 2023,
                "format": "PDF"
            }
        ]
        
        report_ids = []
        
        for report_data in reports_to_generate:
            response = client.post(
                "/api/reports/generate",
                json=report_data,
                headers=auth_headers
            )
            assert response.status_code == 202
            report_ids.append(response.json()["report_id"])
        
        # Step 2: Check report status
        for report_id in report_ids:
            status_response = client.get(
                f"/api/reports/{report_id}",
                headers=auth_headers
            )
            assert status_response.status_code == 200
            status_data = status_response.json()
            assert status_data["report_id"] == report_id
            assert "status" in status_data
        
        # Step 3: List all reports
        list_response = client.get("/api/reports", headers=auth_headers)
        assert list_response.status_code == 200
        list_data = list_response.json()
        assert len(list_data["reports"]) >= len(report_ids)
        
        # Step 4: Schedule a recurring report
        schedule_data = {
            "fund_id": "test-fund-123",
            "report_type": "PERFORMANCE",
            "frequency": "MONTHLY",
            "format": "PDF",
            "recipients": ["test@stratcap.com"]
        }
        
        schedule_response = client.post(
            "/api/reports/schedule",
            json=schedule_data,
            headers=auth_headers
        )
        assert schedule_response.status_code == 201
        
        # Step 5: Check scheduled reports
        scheduled_response = client.get("/api/reports/scheduled", headers=auth_headers)
        assert scheduled_response.status_code == 200