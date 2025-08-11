const axios = require('axios');

const API_BASE = 'http://localhost:8000/api';

const sampleData = {
  fundFamily: {
    name: 'Sample Fund Family',
    code: 'SFF',
    description: 'Sample fund family for testing',
    managementCompany: 'Sample Management LLC',
    primaryCurrency: 'USD',
    fiscalYearEnd: '12-31',
    status: 'active'
  },
  funds: [
    {
      name: 'Sample Growth Fund I',
      code: 'SGF-I',
      type: 'master',
      vintage: 2023,
      targetSize: '100000000',
      hardCap: '120000000',
      managementFeeRate: '0.02',
      carriedInterestRate: '0.20',
      preferredReturnRate: '0.08',
      currency: 'USD',
      status: 'investing'
    },
    {
      name: 'Sample Value Fund II',
      code: 'SVF-II',
      type: 'master',
      vintage: 2024,
      targetSize: '200000000',
      managementFeeRate: '0.02',
      carriedInterestRate: '0.20',
      preferredReturnRate: '0.08',
      currency: 'USD',
      status: 'fundraising'
    }
  ],
  investors: [
    {
      name: 'Sample Pension Fund',
      legalName: 'Sample State Pension Fund',
      type: 'institution',
      entityType: 'pension fund',
      domicile: 'US',
      accreditedInvestor: true,
      qualifiedPurchaser: true,
      country: 'United States',
      primaryContact: 'John Smith',
      primaryEmail: 'j.smith@samplefund.com',
      primaryPhone: '+1-555-0123',
      kycStatus: 'approved',
      amlStatus: 'approved'
    },
    {
      name: 'Sample Endowment',
      legalName: 'Sample University Endowment',
      type: 'institution',
      entityType: 'endowment',
      domicile: 'US',
      accreditedInvestor: true,
      qualifiedPurchaser: true,
      country: 'United States',
      primaryContact: 'Jane Doe',
      primaryEmail: 'j.doe@sampleuni.edu',
      primaryPhone: '+1-555-0124',
      kycStatus: 'approved',
      amlStatus: 'approved'
    }
  ]
};

async function seedData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Create fund family first
    console.log('Creating fund family...');
    const fundFamilyResponse = await axios.post(`${API_BASE}/fund-families`, sampleData.fundFamily);
    console.log('Fund Family Response:', fundFamilyResponse.data);
    const fundFamilyId = fundFamilyResponse.data.data?.id || fundFamilyResponse.data.id || 1;
    console.log(`✅ Created fund family with ID: ${fundFamilyId}`);

    // Create funds
    console.log('Creating funds...');
    for (const fund of sampleData.funds) {
      fund.fundFamilyId = fundFamilyId;
      const response = await axios.post(`${API_BASE}/funds`, fund);
      console.log('Fund Response:', response.data);
      const fundId = response.data.data?.id || response.data.id || 'unknown';
      console.log(`✅ Created fund: ${fund.name} (ID: ${fundId})`);
    }

    // Create investors
    console.log('Creating investors...');
    for (const investor of sampleData.investors) {
      const response = await axios.post(`${API_BASE}/investors`, investor);
      console.log(`✅ Created investor: ${investor.name} (ID: ${response.data.data.id})`);
    }

    console.log('🎉 Sample data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.response?.data || error.message);
  }
}

seedData();