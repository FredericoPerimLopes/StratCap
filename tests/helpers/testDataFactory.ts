import { Decimal } from 'decimal.js';
import { faker } from '@faker-js/faker';

// Base interfaces for test data
interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  mfaEnabled?: boolean;
}

interface TestFundFamily {
  name: string;
  description: string;
  headquarters: string;
  foundedYear: number;
  website?: string;
  aum: string;
}

interface TestFund {
  name: string;
  fundFamilyId: number;
  fundType: 'private_equity' | 'venture_capital' | 'real_estate' | 'hedge_fund';
  targetSize: string;
  managementFeeRate: string;
  carriedInterestRate: string;
  preferredReturnRate: string;
  vintage: number;
  currency: string;
  jurisdiction: string;
  status: 'fundraising' | 'active' | 'harvesting' | 'liquidating' | 'liquidated';
  inceptionDate?: Date;
}

interface TestInvestor {
  entityName: string;
  entityType: 'pension_fund' | 'insurance' | 'endowment' | 'corporation' | 'individual' | 'fund_of_funds';
  jurisdiction: string;
  taxStatus: 'tax_exempt' | 'taxable';
  contactEmail: string;
  contactPhone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  kycStatus?: 'pending' | 'approved' | 'rejected';
}

interface TestCommitment {
  investorEntityId: number;
  fundId: number;
  commitmentAmount: string;
  capitalCalled?: string;
  capitalReturned?: string;
  commitmentDate: Date;
  status: 'pending' | 'active' | 'terminated';
  closingId?: number;
}

interface TestCreditFacility {
  name: string;
  facilityType: 'revolving_credit' | 'term_loan' | 'bridge_loan';
  totalCommitment: string;
  currency: string;
  interestRate: string;
  maturityDate: string;
  lenderName: string;
  fundId: number;
  covenants?: any;
}

interface TestDocument {
  name: string;
  description?: string;
  category: 'legal' | 'financial' | 'operational' | 'compliance' | 'other';
  entityType?: string;
  entityId?: number;
  tags?: string[];
  fileName: string;
  fileSize: number;
  mimeType: string;
}

/**
 * Test Data Factory - Creates realistic test data for various entities
 */
export class TestDataFactory {
  private static instance: TestDataFactory;
  private userCounter = 1;
  private fundFamilyCounter = 1;
  private fundCounter = 1;
  private investorCounter = 1;

  public static getInstance(): TestDataFactory {
    if (!TestDataFactory.instance) {
      TestDataFactory.instance = new TestDataFactory();
    }
    return TestDataFactory.instance;
  }

  /**
   * Create test user data
   */
  createUser(overrides: Partial<TestUser> = {}): TestUser {
    const counter = this.userCounter++;
    return {
      email: overrides.email || `testuser${counter}@stratcap.com`,
      password: overrides.password || 'TestPassword123!',
      firstName: overrides.firstName || faker.person.firstName(),
      lastName: overrides.lastName || faker.person.lastName(),
      role: overrides.role || 'user',
      isActive: overrides.isActive ?? true,
      mfaEnabled: overrides.mfaEnabled ?? false,
      ...overrides
    };
  }

  /**
   * Create admin user data
   */
  createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
    return this.createUser({
      role: 'admin',
      email: 'admin@stratcap.com',
      firstName: 'Admin',
      lastName: 'User',
      ...overrides
    });
  }

  /**
   * Create fund family test data
   */
  createFundFamily(overrides: Partial<TestFundFamily> = {}): TestFundFamily {
    const counter = this.fundFamilyCounter++;
    const companyName = faker.company.name();
    
    return {
      name: overrides.name || `${companyName} Capital Partners`,
      description: overrides.description || `${companyName} is a leading private equity firm focused on growth investments.`,
      headquarters: overrides.headquarters || `${faker.location.city()}, ${faker.location.state()}`,
      foundedYear: overrides.foundedYear || faker.date.past({ years: 20 }).getFullYear(),
      website: overrides.website || `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      aum: overrides.aum || this.generateRandomAmount(500000000, 5000000000),
      ...overrides
    };
  }

  /**
   * Create fund test data
   */
  createFund(fundFamilyId: number, overrides: Partial<TestFund> = {}): TestFund {
    const counter = this.fundCounter++;
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V'];
    const numeral = romanNumerals[(counter - 1) % romanNumerals.length];
    
    return {
      name: overrides.name || `Growth Fund ${numeral}`,
      fundFamilyId,
      fundType: overrides.fundType || 'private_equity',
      targetSize: overrides.targetSize || this.generateRandomAmount(100000000, 1000000000),
      managementFeeRate: overrides.managementFeeRate || '2.0',
      carriedInterestRate: overrides.carriedInterestRate || '20.0',
      preferredReturnRate: overrides.preferredReturnRate || '8.0',
      vintage: overrides.vintage || new Date().getFullYear(),
      currency: overrides.currency || 'USD',
      jurisdiction: overrides.jurisdiction || faker.helpers.arrayElement(['Delaware', 'Cayman Islands', 'Luxembourg']),
      status: overrides.status || 'active',
      inceptionDate: overrides.inceptionDate || faker.date.past({ years: 2 }),
      ...overrides
    };
  }

  /**
   * Create investor test data
   */
  createInvestor(overrides: Partial<TestInvestor> = {}): TestInvestor {
    const counter = this.investorCounter++;
    const entityTypes = ['pension_fund', 'insurance', 'endowment', 'corporation', 'fund_of_funds'] as const;
    const entityType = overrides.entityType || faker.helpers.arrayElement(entityTypes);
    
    const entityNames = {
      pension_fund: `${faker.location.state()} State Pension Fund`,
      insurance: `${faker.company.name()} Insurance Company`,
      endowment: `${faker.company.name()} University Endowment`,
      corporation: `${faker.company.name()} Corporation`,
      fund_of_funds: `${faker.company.name()} Fund of Funds`,
      individual: `${faker.person.fullName()}`
    };

    return {
      entityName: overrides.entityName || entityNames[entityType],
      entityType,
      jurisdiction: overrides.jurisdiction || faker.location.state(),
      taxStatus: overrides.taxStatus || (entityType === 'individual' ? 'taxable' : 'tax_exempt'),
      contactEmail: overrides.contactEmail || `contact${counter}@${faker.internet.domainName()}`,
      contactPhone: overrides.contactPhone || faker.phone.number(),
      address: overrides.address || {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        zipCode: faker.location.zipCode(),
        country: 'USA'
      },
      kycStatus: overrides.kycStatus || 'approved',
      ...overrides
    };
  }

  /**
   * Create commitment test data
   */
  createCommitment(investorEntityId: number, fundId: number, overrides: Partial<TestCommitment> = {}): TestCommitment {
    const commitmentAmount = new Decimal(overrides.commitmentAmount || this.generateRandomAmount(1000000, 50000000));
    const calledPercentage = Math.random() * 0.8; // 0-80% called
    const returnedPercentage = Math.random() * calledPercentage; // 0-called% returned

    return {
      investorEntityId,
      fundId,
      commitmentAmount: commitmentAmount.toFixed(2),
      capitalCalled: overrides.capitalCalled || commitmentAmount.mul(calledPercentage).toFixed(2),
      capitalReturned: overrides.capitalReturned || commitmentAmount.mul(returnedPercentage).toFixed(2),
      commitmentDate: overrides.commitmentDate || faker.date.past({ years: 3 }),
      status: overrides.status || 'active',
      closingId: overrides.closingId || faker.number.int({ min: 1, max: 5 }),
      ...overrides
    };
  }

  /**
   * Create credit facility test data
   */
  createCreditFacility(fundId: number, overrides: Partial<TestCreditFacility> = {}): TestCreditFacility {
    const facilityTypes = ['revolving_credit', 'term_loan', 'bridge_loan'] as const;
    const lenders = ['JPMorgan Chase', 'Goldman Sachs', 'Bank of America', 'Wells Fargo', 'Citibank'];
    
    return {
      name: overrides.name || `${faker.helpers.arrayElement(lenders)} Credit Line`,
      facilityType: overrides.facilityType || faker.helpers.arrayElement(facilityTypes),
      totalCommitment: overrides.totalCommitment || this.generateRandomAmount(25000000, 100000000),
      currency: overrides.currency || 'USD',
      interestRate: overrides.interestRate || (3 + Math.random() * 7).toFixed(2), // 3-10%
      maturityDate: overrides.maturityDate || faker.date.future({ years: 3 }).toISOString().split('T')[0],
      lenderName: overrides.lenderName || faker.helpers.arrayElement(lenders),
      fundId,
      covenants: overrides.covenants || {
        maxLeverageRatio: 3.0 + Math.random() * 2, // 3-5x
        minCoverageRatio: 1.2 + Math.random() * 0.8, // 1.2-2.0x
      },
      ...overrides
    };
  }

  /**
   * Create document test data
   */
  createDocument(overrides: Partial<TestDocument> = {}): TestDocument {
    const categories = ['legal', 'financial', 'operational', 'compliance', 'other'] as const;
    const category = overrides.category || faker.helpers.arrayElement(categories);
    
    const documentTypes = {
      legal: ['Partnership Agreement', 'Side Letter', 'Subscription Agreement', 'Constitutional Documents'],
      financial: ['Financial Statement', 'Audit Report', 'Tax Return', 'Valuation Report'],
      operational: ['Investment Committee Minutes', 'Board Resolution', 'Compliance Report'],
      compliance: ['KYC Documents', 'AML Check', 'Regulatory Filing', 'Due Diligence Report'],
      other: ['Presentation', 'Marketing Material', 'Research Report', 'Correspondence']
    };

    const docType = faker.helpers.arrayElement(documentTypes[category]);
    const extension = category === 'financial' ? 'xlsx' : 'pdf';
    
    return {
      name: overrides.name || `${docType} - ${faker.date.recent().toISOString().split('T')[0]}`,
      description: overrides.description || `${docType} document for testing purposes`,
      category,
      fileName: overrides.fileName || `${docType.toLowerCase().replace(/\s+/g, '-')}.${extension}`,
      fileSize: overrides.fileSize || faker.number.int({ min: 1024, max: 10485760 }), // 1KB - 10MB
      mimeType: overrides.mimeType || (extension === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
      tags: overrides.tags || faker.helpers.arrayElements(['important', 'draft', 'final', 'confidential'], { min: 1, max: 3 }),
      ...overrides
    };
  }

  /**
   * Create a complete fund ecosystem (fund family, fund, investors, commitments)
   */
  createFundEcosystem(options: {
    investorCount?: number;
    commitmentRange?: [number, number];
    includeCreditFacility?: boolean;
  } = {}) {
    const { investorCount = 5, commitmentRange = [5000000, 25000000], includeCreditFacility = false } = options;

    // Create fund family and fund
    const fundFamily = this.createFundFamily();
    const fund = this.createFund(1); // Assuming fundFamilyId = 1 after creation
    
    // Create investors and commitments
    const investors = Array.from({ length: investorCount }, () => this.createInvestor());
    const commitments = investors.map((_, index) => 
      this.createCommitment(
        index + 1, // Assuming investorId starts from 1
        1, // Assuming fundId = 1
        { commitmentAmount: this.generateRandomAmount(commitmentRange[0], commitmentRange[1]) }
      )
    );

    // Optionally create credit facility
    const creditFacility = includeCreditFacility ? this.createCreditFacility(1) : null;

    return {
      fundFamily,
      fund,
      investors,
      commitments,
      creditFacility
    };
  }

  /**
   * Generate batch test data for performance testing
   */
  generateBatchData(counts: {
    fundFamilies?: number;
    funds?: number;
    investors?: number;
    documents?: number;
  } = {}) {
    const {
      fundFamilies = 10,
      funds = 25,
      investors = 100,
      documents = 200
    } = counts;

    return {
      fundFamilies: Array.from({ length: fundFamilies }, () => this.createFundFamily()),
      funds: Array.from({ length: funds }, (_, i) => 
        this.createFund(Math.floor(i / 3) + 1) // 3 funds per family
      ),
      investors: Array.from({ length: investors }, () => this.createInvestor()),
      documents: Array.from({ length: documents }, () => this.createDocument())
    };
  }

  /**
   * Create realistic transaction history
   */
  createTransactionHistory(fundId: number, commitments: TestCommitment[]) {
    const transactions = [];
    
    for (const commitment of commitments) {
      const calledAmount = new Decimal(commitment.capitalCalled || '0');
      const returnedAmount = new Decimal(commitment.capitalReturned || '0');
      
      // Create capital call transactions
      if (calledAmount.gt(0)) {
        const callCount = faker.number.int({ min: 1, max: 4 });
        const callAmount = calledAmount.div(callCount);
        
        for (let i = 0; i < callCount; i++) {
          transactions.push({
            fundId,
            commitmentId: commitment.investorEntityId, // Simplified mapping
            transactionDate: faker.date.past({ years: 2 }),
            transactionType: 'capital_call',
            transactionCode: `CC${String(i + 1).padStart(3, '0')}`,
            description: `Capital Call ${i + 1}`,
            amount: callAmount.toFixed(2),
            direction: 'debit'
          });
        }
      }
      
      // Create distribution transactions
      if (returnedAmount.gt(0)) {
        const distCount = faker.number.int({ min: 1, max: 3 });
        const distAmount = returnedAmount.div(distCount);
        
        for (let i = 0; i < distCount; i++) {
          transactions.push({
            fundId,
            commitmentId: commitment.investorEntityId,
            transactionDate: faker.date.recent({ days: 180 }),
            transactionType: 'distribution',
            transactionCode: `DIST${String(i + 1).padStart(3, '0')}`,
            description: `Distribution ${i + 1}`,
            amount: distAmount.toFixed(2),
            direction: 'credit'
          });
        }
      }
    }
    
    return transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
  }

  /**
   * Helper method to generate random monetary amounts
   */
  private generateRandomAmount(min: number, max: number): string {
    const amount = faker.number.int({ min, max });
    return amount.toFixed(2);
  }

  /**
   * Reset counters (useful for tests)
   */
  resetCounters(): void {
    this.userCounter = 1;
    this.fundFamilyCounter = 1;
    this.fundCounter = 1;
    this.investorCounter = 1;
  }

  /**
   * Create data with relationships for integration testing
   */
  createRelatedTestData() {
    const user = this.createAdminUser();
    const fundFamily = this.createFundFamily();
    const fund = this.createFund(1); // fundFamilyId will be 1 after creation
    const investor = this.createInvestor();
    const commitment = this.createCommitment(1, 1); // investorId=1, fundId=1
    const creditFacility = this.createCreditFacility(1);
    const document = this.createDocument({
      entityType: 'fund',
      entityId: 1
    });

    return {
      user,
      fundFamily,
      fund,
      investor,
      commitment,
      creditFacility,
      document
    };
  }
}

// Export singleton instance
export const testDataFactory = TestDataFactory.getInstance();

// Export helper functions for easy access
export const createTestUser = (overrides?: Partial<TestUser>) => testDataFactory.createUser(overrides);
export const createTestFundFamily = (overrides?: Partial<TestFundFamily>) => testDataFactory.createFundFamily(overrides);
export const createTestFund = (fundFamilyId: number, overrides?: Partial<TestFund>) => testDataFactory.createFund(fundFamilyId, overrides);
export const createTestInvestor = (overrides?: Partial<TestInvestor>) => testDataFactory.createInvestor(overrides);
export const createTestCommitment = (investorEntityId: number, fundId: number, overrides?: Partial<TestCommitment>) => 
  testDataFactory.createCommitment(investorEntityId, fundId, overrides);
export const createTestCreditFacility = (fundId: number, overrides?: Partial<TestCreditFacility>) => 
  testDataFactory.createCreditFacility(fundId, overrides);
export const createTestDocument = (overrides?: Partial<TestDocument>) => testDataFactory.createDocument(overrides);