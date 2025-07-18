"""
Single Source of Truth Data Consolidation Layer

Inspired by Maybern's approach to centralizing all fund and operational data
in a secure, accessible repository with consistent information across fund management.
"""

from typing import Dict, List, Any, Optional, Union
from datetime import datetime, date
from decimal import Decimal
from dataclasses import dataclass, field
from enum import Enum
import json
import asyncio

from ..models.fund_structure import FundStructure
from ..models.fund_events import FundEvent, InvestorEventCalculation
from ..models.investor import Investor
from ..utils.logger import get_logger

logger = get_logger(__name__)


class DataSourceType(str, Enum):
    FUND_MANAGEMENT = "fund_management"
    ACCOUNTING = "accounting"
    LEGAL = "legal"
    COMPLIANCE = "compliance"
    EXTERNAL_ADMIN = "external_admin"
    CUSTODIAN = "custodian"
    TRANSFER_AGENT = "transfer_agent"
    AUDIT = "audit"


class DataStatus(str, Enum):
    CURRENT = "current"
    STALE = "stale"
    RECONCILING = "reconciling"
    ERROR = "error"
    PENDING_APPROVAL = "pending_approval"


@dataclass
class DataSource:
    """Configuration for a data source"""
    source_id: str
    name: str
    source_type: DataSourceType
    connection_config: Dict[str, Any]
    update_frequency: str  # cron expression
    last_update: Optional[datetime] = None
    status: DataStatus = DataStatus.CURRENT
    error_message: Optional[str] = None


@dataclass
class ConsolidatedDataRecord:
    """A single consolidated data record"""
    record_id: str
    entity_type: str  # fund, investor, commitment, event, etc.
    entity_id: str
    data: Dict[str, Any]
    
    # Source tracking
    primary_source: str
    contributing_sources: List[str] = field(default_factory=list)
    
    # Quality metrics
    confidence_score: float = 1.0
    completeness_score: float = 1.0
    consistency_score: float = 1.0
    
    # Temporal tracking
    as_of_date: date = field(default_factory=date.today)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    
    # Validation
    validation_status: str = "pending"
    validation_errors: List[str] = field(default_factory=list)
    validation_warnings: List[str] = field(default_factory=list)


@dataclass
class ReconciliationResult:
    """Result of data reconciliation between sources"""
    entity_type: str
    entity_id: str
    reconciliation_date: datetime
    
    # Comparison results
    matching_fields: List[str] = field(default_factory=list)
    differing_fields: List[str] = field(default_factory=list)
    missing_from_primary: List[str] = field(default_factory=list)
    missing_from_secondary: List[str] = field(default_factory=list)
    
    # Resolution
    resolution_required: bool = False
    resolution_status: str = "pending"
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None


class DataConsolidationEngine:
    """
    Single Source of Truth data consolidation engine.
    
    Consolidates data from multiple sources (fund admin, accounting, legal, etc.)
    into a unified, consistent view with quality metrics and reconciliation.
    """
    
    def __init__(self):
        self.data_sources: Dict[str, DataSource] = {}
        self.consolidated_data: Dict[str, ConsolidatedDataRecord] = {}
        self.reconciliation_rules: Dict[str, Dict[str, Any]] = {}
        self.quality_thresholds = {
            "confidence_min": 0.8,
            "completeness_min": 0.9,
            "consistency_min": 0.95
        }
        
        self._setup_default_sources()
        self._setup_reconciliation_rules()
    
    def register_data_source(self, source: DataSource):
        """Register a new data source"""
        self.data_sources[source.source_id] = source
        logger.info(f"Registered data source: {source.name}")
    
    async def consolidate_fund_data(self, fund_id: str) -> Dict[str, Any]:
        """
        Consolidate all data related to a specific fund from multiple sources
        """
        consolidated_fund = {
            "fund_basic_info": {},
            "fund_performance": {},
            "fund_positions": {},
            "fund_cashflows": {},
            "fund_compliance": {},
            "investors": {},
            "commitments": {},
            "events": {},
            "legal_documents": {},
            "consolidation_metadata": {}
        }
        
        # Gather data from all sources
        source_data = await self._gather_fund_data_from_sources(fund_id)
        
        # Consolidate basic fund information
        consolidated_fund["fund_basic_info"] = await self._consolidate_fund_basic_info(
            fund_id, source_data
        )
        
        # Consolidate performance data
        consolidated_fund["fund_performance"] = await self._consolidate_performance_data(
            fund_id, source_data
        )
        
        # Consolidate investor data
        consolidated_fund["investors"] = await self._consolidate_investor_data(
            fund_id, source_data
        )
        
        # Consolidate commitment data
        consolidated_fund["commitments"] = await self._consolidate_commitment_data(
            fund_id, source_data
        )
        
        # Consolidate event data
        consolidated_fund["events"] = await self._consolidate_event_data(
            fund_id, source_data
        )
        
        # Add consolidation metadata
        consolidated_fund["consolidation_metadata"] = {
            "consolidation_date": datetime.utcnow(),
            "sources_used": list(source_data.keys()),
            "quality_scores": await self._calculate_overall_quality_scores(consolidated_fund),
            "reconciliation_status": await self._get_reconciliation_status(fund_id)
        }
        
        return consolidated_fund
    
    async def _gather_fund_data_from_sources(self, fund_id: str) -> Dict[str, Dict[str, Any]]:
        """Gather fund data from all configured sources"""
        source_data = {}
        
        # In a real implementation, this would connect to actual data sources
        # For demonstration, we'll create mock data
        
        # Fund administration system data
        source_data["fund_admin"] = {
            "fund_basic_info": {
                "fund_id": fund_id,
                "fund_name": "Strategic Growth Fund I",
                "inception_date": "2024-01-01",
                "target_size": Decimal("500000000"),
                "committed_capital": Decimal("400000000"),
                "called_capital": Decimal("250000000"),
                "management_fee_rate": Decimal("0.02"),
                "carry_rate": Decimal("0.20")
            },
            "investors": [
                {"investor_id": "inv_001", "name": "Pension Fund Alpha", "commitment": Decimal("100000000")},
                {"investor_id": "inv_002", "name": "University Endowment", "commitment": Decimal("150000000")},
                {"investor_id": "inv_003", "name": "Family Office Beta", "commitment": Decimal("75000000")},
                {"investor_id": "inv_004", "name": "Sovereign Wealth Fund", "commitment": Decimal("75000000")}
            ]
        }
        
        # Accounting system data
        source_data["accounting"] = {
            "fund_performance": {
                "nav": Decimal("320000000"),
                "irr": Decimal("0.155"),
                "moic": Decimal("1.28"),
                "dpi": Decimal("0.15"),
                "rvpi": Decimal("1.13")
            },
            "cashflows": [
                {"date": "2024-01-15", "type": "capital_call", "amount": Decimal("100000000")},
                {"date": "2024-03-20", "type": "capital_call", "amount": Decimal("75000000")},
                {"date": "2024-06-15", "type": "distribution", "amount": Decimal("25000000")},
                {"date": "2024-09-10", "type": "capital_call", "amount": Decimal("75000000")}
            ]
        }
        
        # Legal/compliance data
        source_data["legal"] = {
            "fund_compliance": {
                "regulatory_status": "compliant",
                "last_audit_date": "2024-06-30",
                "aum_limit_utilization": Decimal("0.80"),
                "investor_limit_utilization": Decimal("0.45")
            },
            "legal_documents": [
                {"document_type": "LPA", "version": "2.1", "effective_date": "2024-01-01"},
                {"document_type": "side_letter", "investor_id": "inv_001", "effective_date": "2024-01-01"},
                {"document_type": "side_letter", "investor_id": "inv_002", "effective_date": "2024-02-01"}
            ]
        }
        
        # Custodian data
        source_data["custodian"] = {
            "fund_positions": [
                {"portfolio_company": "Company A", "cost_basis": Decimal("50000000"), "fair_value": Decimal("75000000")},
                {"portfolio_company": "Company B", "cost_basis": Decimal("80000000"), "fair_value": Decimal("110000000")},
                {"portfolio_company": "Company C", "cost_basis": Decimal("70000000"), "fair_value": Decimal("95000000")},
                {"cash": "cash_account", "cost_basis": Decimal("50000000"), "fair_value": Decimal("50000000")}
            ]
        }
        
        return source_data
    
    async def _consolidate_fund_basic_info(
        self, 
        fund_id: str, 
        source_data: Dict[str, Dict[str, Any]]
    ) -> ConsolidatedDataRecord:
        """Consolidate basic fund information from multiple sources"""
        
        # Primary source is fund admin
        primary_data = source_data.get("fund_admin", {}).get("fund_basic_info", {})
        
        # Cross-reference with other sources
        legal_data = source_data.get("legal", {}).get("fund_compliance", {})
        
        consolidated_info = {
            **primary_data,
            "regulatory_status": legal_data.get("regulatory_status"),
            "last_audit_date": legal_data.get("last_audit_date")
        }
        
        # Calculate quality scores
        confidence_score = self._calculate_confidence_score(
            consolidated_info, ["fund_admin", "legal"]
        )
        completeness_score = self._calculate_completeness_score(consolidated_info)
        consistency_score = await self._check_cross_source_consistency(
            fund_id, "fund_basic_info", source_data
        )
        
        return ConsolidatedDataRecord(
            record_id=f"fund_basic_{fund_id}",
            entity_type="fund_basic_info",
            entity_id=fund_id,
            data=consolidated_info,
            primary_source="fund_admin",
            contributing_sources=["fund_admin", "legal"],
            confidence_score=confidence_score,
            completeness_score=completeness_score,
            consistency_score=consistency_score
        )
    
    async def _consolidate_performance_data(
        self, 
        fund_id: str, 
        source_data: Dict[str, Dict[str, Any]]
    ) -> ConsolidatedDataRecord:
        """Consolidate fund performance data"""
        
        # Primary source is accounting
        performance_data = source_data.get("accounting", {}).get("fund_performance", {})
        
        # Validate performance metrics
        validation_errors = []
        if performance_data.get("moic", 0) < 0:
            validation_errors.append("MOIC cannot be negative")
        
        return ConsolidatedDataRecord(
            record_id=f"fund_performance_{fund_id}",
            entity_type="fund_performance",
            entity_id=fund_id,
            data=performance_data,
            primary_source="accounting",
            contributing_sources=["accounting"],
            validation_errors=validation_errors
        )
    
    async def _consolidate_investor_data(
        self, 
        fund_id: str, 
        source_data: Dict[str, Dict[str, Any]]
    ) -> Dict[str, ConsolidatedDataRecord]:
        """Consolidate investor data from multiple sources"""
        
        consolidated_investors = {}
        
        # Get investor data from fund admin
        investors = source_data.get("fund_admin", {}).get("investors", [])
        
        for investor in investors:
            investor_id = investor["investor_id"]
            
            # Check for side letters in legal data
            legal_docs = source_data.get("legal", {}).get("legal_documents", [])
            side_letters = [
                doc for doc in legal_docs 
                if doc.get("document_type") == "side_letter" 
                and doc.get("investor_id") == investor_id
            ]
            
            consolidated_investor_data = {
                **investor,
                "side_letters": side_letters,
                "has_special_terms": len(side_letters) > 0
            }
            
            consolidated_investors[investor_id] = ConsolidatedDataRecord(
                record_id=f"investor_{investor_id}",
                entity_type="investor",
                entity_id=investor_id,
                data=consolidated_investor_data,
                primary_source="fund_admin",
                contributing_sources=["fund_admin", "legal"]
            )
        
        return consolidated_investors
    
    async def _consolidate_commitment_data(
        self, 
        fund_id: str, 
        source_data: Dict[str, Dict[str, Any]]
    ) -> Dict[str, ConsolidatedDataRecord]:
        """Consolidate commitment data"""
        
        consolidated_commitments = {}
        
        # Extract commitments from investor data
        investors = source_data.get("fund_admin", {}).get("investors", [])
        
        for investor in investors:
            commitment_id = f"comm_{investor['investor_id']}"
            
            commitment_data = {
                "commitment_id": commitment_id,
                "investor_id": investor["investor_id"],
                "fund_id": fund_id,
                "commitment_amount": investor["commitment"],
                "commitment_date": "2024-01-01",  # Would come from actual data
                "status": "active"
            }
            
            consolidated_commitments[commitment_id] = ConsolidatedDataRecord(
                record_id=commitment_id,
                entity_type="commitment",
                entity_id=commitment_id,
                data=commitment_data,
                primary_source="fund_admin",
                contributing_sources=["fund_admin"]
            )
        
        return consolidated_commitments
    
    async def _consolidate_event_data(
        self, 
        fund_id: str, 
        source_data: Dict[str, Dict[str, Any]]
    ) -> Dict[str, ConsolidatedDataRecord]:
        """Consolidate fund event data"""
        
        consolidated_events = {}
        
        # Extract events from cashflow data
        cashflows = source_data.get("accounting", {}).get("cashflows", [])
        
        for i, cashflow in enumerate(cashflows):
            event_id = f"event_{fund_id}_{i+1}"
            
            event_data = {
                "event_id": event_id,
                "fund_id": fund_id,
                "event_type": cashflow["type"],
                "event_date": cashflow["date"],
                "amount": cashflow["amount"],
                "status": "completed"
            }
            
            consolidated_events[event_id] = ConsolidatedDataRecord(
                record_id=event_id,
                entity_type="fund_event",
                entity_id=event_id,
                data=event_data,
                primary_source="accounting",
                contributing_sources=["accounting"]
            )
        
        return consolidated_events
    
    async def reconcile_data_sources(
        self, 
        entity_type: str, 
        entity_id: str,
        primary_source: str,
        secondary_source: str
    ) -> ReconciliationResult:
        """Reconcile data between two sources for an entity"""
        
        # Get data from both sources
        primary_data = await self._get_data_from_source(primary_source, entity_type, entity_id)
        secondary_data = await self._get_data_from_source(secondary_source, entity_type, entity_id)
        
        result = ReconciliationResult(
            entity_type=entity_type,
            entity_id=entity_id,
            reconciliation_date=datetime.utcnow()
        )
        
        # Compare fields
        all_fields = set(primary_data.keys()) | set(secondary_data.keys())
        
        for field in all_fields:
            if field in primary_data and field in secondary_data:
                if primary_data[field] == secondary_data[field]:
                    result.matching_fields.append(field)
                else:
                    result.differing_fields.append(field)
            elif field in primary_data:
                result.missing_from_secondary.append(field)
            else:
                result.missing_from_primary.append(field)
        
        # Determine if resolution is required
        result.resolution_required = (
            len(result.differing_fields) > 0 or
            len(result.missing_from_primary) > 0 or
            len(result.missing_from_secondary) > 0
        )
        
        return result
    
    def _calculate_confidence_score(self, data: Dict[str, Any], sources: List[str]) -> float:
        """Calculate confidence score based on data quality and source reliability"""
        base_score = 1.0
        
        # Reduce score for missing critical fields
        critical_fields = ["fund_id", "fund_name", "inception_date"]
        missing_critical = sum(1 for field in critical_fields if not data.get(field))
        base_score -= (missing_critical * 0.2)
        
        # Adjust based on number of contributing sources
        if len(sources) > 1:
            base_score += 0.1  # Bonus for multiple sources
        
        return max(0.0, min(1.0, base_score))
    
    def _calculate_completeness_score(self, data: Dict[str, Any]) -> float:
        """Calculate completeness score based on data completeness"""
        total_fields = len(data)
        populated_fields = sum(1 for value in data.values() if value is not None and value != "")
        
        return populated_fields / total_fields if total_fields > 0 else 0.0
    
    async def _check_cross_source_consistency(
        self, 
        entity_id: str, 
        entity_type: str, 
        source_data: Dict[str, Dict[str, Any]]
    ) -> float:
        """Check consistency across multiple data sources"""
        
        # For demonstration, return high consistency
        # In real implementation, this would compare critical fields across sources
        return 0.95
    
    async def _calculate_overall_quality_scores(self, consolidated_fund: Dict[str, Any]) -> Dict[str, float]:
        """Calculate overall quality scores for the consolidated fund data"""
        
        all_records = []
        
        # Collect all consolidated records
        for section_key, section_data in consolidated_fund.items():
            if isinstance(section_data, ConsolidatedDataRecord):
                all_records.append(section_data)
            elif isinstance(section_data, dict):
                for record in section_data.values():
                    if isinstance(record, ConsolidatedDataRecord):
                        all_records.append(record)
        
        if not all_records:
            return {"overall_confidence": 0.0, "overall_completeness": 0.0, "overall_consistency": 0.0}
        
        # Calculate averages
        avg_confidence = sum(record.confidence_score for record in all_records) / len(all_records)
        avg_completeness = sum(record.completeness_score for record in all_records) / len(all_records)
        avg_consistency = sum(record.consistency_score for record in all_records) / len(all_records)
        
        return {
            "overall_confidence": round(avg_confidence, 3),
            "overall_completeness": round(avg_completeness, 3),
            "overall_consistency": round(avg_consistency, 3)
        }
    
    async def _get_reconciliation_status(self, fund_id: str) -> Dict[str, Any]:
        """Get reconciliation status for a fund"""
        
        return {
            "last_reconciliation": datetime.utcnow() - timedelta(hours=2),
            "pending_reconciliations": 0,
            "failed_reconciliations": 0,
            "overall_status": "current"
        }
    
    async def _get_data_from_source(
        self, 
        source_id: str, 
        entity_type: str, 
        entity_id: str
    ) -> Dict[str, Any]:
        """Get data from a specific source"""
        
        # Mock implementation - would connect to actual source
        return {"mock_field": "mock_value"}
    
    def _setup_default_sources(self):
        """Setup default data sources"""
        
        sources = [
            DataSource(
                source_id="fund_admin",
                name="Fund Administration System",
                source_type=DataSourceType.FUND_MANAGEMENT,
                connection_config={"endpoint": "https://api.fundadmin.com", "auth": "api_key"}
            ),
            DataSource(
                source_id="accounting",
                name="Accounting System", 
                source_type=DataSourceType.ACCOUNTING,
                connection_config={"endpoint": "https://api.accounting.com", "auth": "oauth2"}
            ),
            DataSource(
                source_id="legal",
                name="Legal Document Management",
                source_type=DataSourceType.LEGAL,
                connection_config={"endpoint": "https://api.legal.com", "auth": "api_key"}
            ),
            DataSource(
                source_id="custodian",
                name="Custodian System",
                source_type=DataSourceType.CUSTODIAN,
                connection_config={"endpoint": "https://api.custodian.com", "auth": "oauth2"}
            )
        ]
        
        for source in sources:
            self.data_sources[source.source_id] = source
    
    def _setup_reconciliation_rules(self):
        """Setup reconciliation rules for different entity types"""
        
        self.reconciliation_rules = {
            "fund_basic_info": {
                "critical_fields": ["fund_id", "fund_name", "target_size", "management_fee_rate"],
                "tolerance_fields": {"nav": 0.01, "irr": 0.001},  # 1% tolerance for NAV, 0.1% for IRR
                "reconciliation_frequency": "daily"
            },
            "investor": {
                "critical_fields": ["investor_id", "investor_name", "commitment_amount"],
                "tolerance_fields": {},
                "reconciliation_frequency": "weekly"
            },
            "fund_event": {
                "critical_fields": ["event_id", "event_type", "amount", "event_date"],
                "tolerance_fields": {"amount": 0.01},  # 1% tolerance for amounts
                "reconciliation_frequency": "daily"
            }
        }


# Singleton instance
data_consolidator = DataConsolidationEngine()