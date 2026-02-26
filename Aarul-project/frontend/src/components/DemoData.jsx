/**
 * Demo data and utilities for Cloud Architect AI
 */

export const demoMessages = [
  {
    id: '1',
    type: 'user',
    content: 'I need to design a scalable e-commerce platform for 10,000+ daily users with PCI DSS compliance.',
    timestamp: new Date(Date.now() - 300000)
  },
  {
    id: '2',
    type: 'agent',
    content: `I'll help you design a secure, scalable e-commerce platform. Based on your requirements:

**Key Requirements Identified:**
- **Scale**: 10,000+ daily users
- **Compliance**: PCI DSS required
- **Type**: E-commerce platform

**Recommended Architecture:**
1. **Frontend**: CloudFront + S3 for static assets
2. **API Layer**: API Gateway + Lambda for serverless compute
3. **Database**: RDS with encryption for transactional data
4. **Payment Processing**: Separate VPC with enhanced security
5. **Monitoring**: CloudWatch + X-Ray for observability

**Next Steps:**
1. Let me capture detailed requirements through our interview process
2. Generate a complete architecture diagram
3. Provide cost estimates and optimization recommendations

Would you like to start with the requirements capture interview?`,
    timestamp: new Date(Date.now() - 240000)
  },
  {
    id: '3',
    type: 'user',
    content: 'Yes, let\'s start the requirements interview. I also need to support multiple regions.',
    timestamp: new Date(Date.now() - 180000)
  },
  {
    id: '4',
    type: 'agent',
    content: `Perfect! Multi-region support is crucial for global e-commerce. I'm initiating the requirements capture process.

**Requirements Interview Started** 🎤

**Business Requirements:**
1. What's your target geographic regions? (US, EU, APAC?)
2. What's your expected peak traffic during sales events?
3. What payment methods do you need to support?
4. Do you have existing systems to integrate with?

**Technical Requirements:**
1. What's your RTO/RPO requirements for disaster recovery?
2. Do you need real-time inventory management?
3. What's your preferred deployment strategy? (Blue/Green, Rolling?)

I'm switching to the Requirements Capture view to make this more interactive. You can also use the workflow panel to track our progress through the architecture design process.`,
    timestamp: new Date(Date.now() - 120000)
  }
];

export const demoRequirements = {
  business: {
    industry: 'E-commerce',
    userBase: '10,000+ daily users',
    compliance: ['PCI DSS', 'GDPR', 'SOC 2'],
    budget: '$8,000-15,000/month',
    regions: ['US East', 'EU West', 'Asia Pacific'],
    peakTraffic: '50,000 concurrent users',
    paymentMethods: ['Credit Cards', 'PayPal', 'Apple Pay', 'Google Pay']
  },
  technical: {
    expectedLoad: '2,000 requests/second',
    availability: '99.99%',
    dataRetention: '7 years',
    integrations: ['Stripe', 'SendGrid', 'Salesforce', 'Google Analytics'],
    rto: '15 minutes',
    rpo: '5 minutes',
    inventorySync: 'Real-time',
    deploymentStrategy: 'Blue/Green'
  },
  constraints: {
    timeline: '4 months',
    team: '8 developers, 2 DevOps',
    expertise: 'Intermediate AWS',
    regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    securityRequirements: 'High - Financial data',
    performanceTargets: '<200ms API response time'
  }
};

export const demoArchitecture = {
  services: [
    { name: 'CloudFront CDN', type: 'cdn', status: 'configured', region: 'Global' },
    { name: 'API Gateway', type: 'api', status: 'configured', region: 'Multi-region' },
    { name: 'Lambda Functions', type: 'compute', status: 'optimizing', region: 'Multi-region' },
    { name: 'RDS Aurora', type: 'database', status: 'configured', region: 'Multi-region' },
    { name: 'ElastiCache Redis', type: 'cache', status: 'configured', region: 'Multi-region' },
    { name: 'S3 Buckets', type: 'storage', status: 'configured', region: 'Multi-region' },
    { name: 'Cognito', type: 'auth', status: 'configured', region: 'Multi-region' },
    { name: 'SQS/SNS', type: 'messaging', status: 'pending', region: 'Multi-region' },
    { name: 'WAF', type: 'security', status: 'configured', region: 'Global' },
    { name: 'Route 53', type: 'dns', status: 'configured', region: 'Global' }
  ],
  estimatedCost: '$12,400/month',
  optimizationSavings: '$3,200/month',
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  compliance: ['PCI DSS Level 1', 'GDPR Ready', 'SOC 2 Type II'],
  performance: {
    expectedLatency: '<150ms',
    throughput: '2,500 RPS',
    availability: '99.99%'
  }
};

export const demoAgents = [
  { name: 'Requirements Agent', status: 'completed', progress: 100 },
  { name: 'Design Agent', status: 'active', progress: 75 },
  { name: 'Security Agent', status: 'active', progress: 60 },
  { name: 'Cost Agent', status: 'waiting', progress: 0 },
  { name: 'Performance Agent', status: 'waiting', progress: 0 },
  { name: 'Code Generator', status: 'idle', progress: 0 }
];

export const loadDemoData = () => {
  return {
    messages: demoMessages,
    requirements: demoRequirements,
    architecture: demoArchitecture,
    agents: demoAgents,
    currentPhase: 'design'
  };
};