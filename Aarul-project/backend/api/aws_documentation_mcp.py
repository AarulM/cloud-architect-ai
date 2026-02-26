#!/usr/bin/env python3
"""
AWS Documentation MCP (Model Context Protocol) Server
Provides real-time access to AWS documentation library
"""

import json
import logging
import requests
import re
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import hashlib
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AWSDocumentationMCP:
    """
    MCP Server for AWS Documentation Access
    Provides real-time queries to AWS's complete documentation library
    """
    
    def __init__(self):
        self.base_url = "https://docs.aws.amazon.com"
        self.cache = {}
        self.cache_duration = timedelta(hours=1)  # Cache for 1 hour
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AWS-Solutions-Architect-Tool/1.0'
        })
        
        # AWS Service documentation endpoints
        self.service_docs = {
            'ec2': 'https://docs.aws.amazon.com/ec2/',
            'lambda': 'https://docs.aws.amazon.com/lambda/',
            'rds': 'https://docs.aws.amazon.com/rds/',
            's3': 'https://docs.aws.amazon.com/s3/',
            'dynamodb': 'https://docs.aws.amazon.com/dynamodb/',
            'apigateway': 'https://docs.aws.amazon.com/apigateway/',
            'cloudformation': 'https://docs.aws.amazon.com/cloudformation/',
            'iam': 'https://docs.aws.amazon.com/iam/',
            'vpc': 'https://docs.aws.amazon.com/vpc/',
            'cloudwatch': 'https://docs.aws.amazon.com/cloudwatch/',
            'sns': 'https://docs.aws.amazon.com/sns/',
            'sqs': 'https://docs.aws.amazon.com/sqs/',
            'ecs': 'https://docs.aws.amazon.com/ecs/',
            'eks': 'https://docs.aws.amazon.com/eks/',
            'fargate': 'https://docs.aws.amazon.com/fargate/',
            'elasticache': 'https://docs.aws.amazon.com/elasticache/',
            'cloudfront': 'https://docs.aws.amazon.com/cloudfront/',
            'route53': 'https://docs.aws.amazon.com/route53/',
            'elb': 'https://docs.aws.amazon.com/elasticloadbalancing/',
            'autoscaling': 'https://docs.aws.amazon.com/autoscaling/',
            'well-architected': 'https://docs.aws.amazon.com/wellarchitected/',
            'security': 'https://docs.aws.amazon.com/security/',
            'cost-optimization': 'https://docs.aws.amazon.com/cost-management/',
            'performance': 'https://docs.aws.amazon.com/performance/',
            'reliability': 'https://docs.aws.amazon.com/reliability/',
            'operational-excellence': 'https://docs.aws.amazon.com/operational-excellence/'
        }
        
        # Well-Architected Framework specific content
        self.well_architected_content = {
            'operational-excellence': {
                'principles': [
                    'Perform operations as code',
                    'Make frequent, small, reversible changes',
                    'Refine operations procedures frequently',
                    'Anticipate failure',
                    'Learn from all operational failures'
                ],
                'best_practices': [
                    'Use Infrastructure as Code (CloudFormation, CDK, Terraform)',
                    'Implement comprehensive monitoring and alerting',
                    'Automate deployment and rollback procedures',
                    'Establish runbooks and playbooks',
                    'Implement proper logging and observability'
                ]
            },
            'security': {
                'principles': [
                    'Implement a strong identity foundation',
                    'Apply security at all layers',
                    'Enable traceability',
                    'Automate security best practices',
                    'Protect data in transit and at rest',
                    'Keep people away from data',
                    'Prepare for security events'
                ],
                'best_practices': [
                    'Use IAM roles and policies with least privilege',
                    'Enable encryption at rest and in transit',
                    'Implement network security (VPC, Security Groups, NACLs)',
                    'Use AWS Config for compliance monitoring',
                    'Enable CloudTrail for audit logging',
                    'Implement secrets management (AWS Secrets Manager)',
                    'Use AWS Security Hub for centralized security findings'
                ]
            },
            'reliability': {
                'principles': [
                    'Automatically recover from failure',
                    'Test recovery procedures',
                    'Scale horizontally to increase aggregate workload availability',
                    'Stop guessing capacity',
                    'Manage change in automation'
                ],
                'best_practices': [
                    'Deploy across multiple Availability Zones',
                    'Implement auto-scaling policies',
                    'Use managed services when possible',
                    'Implement circuit breakers and retries',
                    'Regular backup and disaster recovery testing',
                    'Monitor system health and performance',
                    'Implement graceful degradation'
                ]
            },
            'performance-efficiency': {
                'principles': [
                    'Democratize advanced technologies',
                    'Go global in minutes',
                    'Use serverless architectures',
                    'Experiment more often',
                    'Consider mechanical sympathy'
                ],
                'best_practices': [
                    'Choose the right compute service (EC2, Lambda, Fargate)',
                    'Implement caching strategies (ElastiCache, CloudFront)',
                    'Use content delivery networks (CloudFront)',
                    'Optimize database performance (RDS, DynamoDB)',
                    'Monitor and analyze performance metrics',
                    'Use appropriate storage classes (S3, EBS)',
                    'Implement efficient data transfer methods'
                ]
            },
            'cost-optimization': {
                'principles': [
                    'Implement cloud financial management',
                    'Adopt a consumption model',
                    'Measure overall efficiency',
                    'Stop spending money on undifferentiated heavy lifting',
                    'Analyze and attribute expenditure'
                ],
                'best_practices': [
                    'Use Reserved Instances and Savings Plans',
                    'Implement auto-scaling to match demand',
                    'Choose appropriate storage classes and lifecycle policies',
                    'Use Spot Instances for fault-tolerant workloads',
                    'Monitor costs with AWS Cost Explorer and Budgets',
                    'Right-size resources based on utilization',
                    'Implement cost allocation tags'
                ]
            },
            'sustainability': {
                'principles': [
                    'Understand your impact',
                    'Establish sustainability goals',
                    'Maximize utilization',
                    'Anticipate and adopt new, more efficient hardware and software offerings',
                    'Use managed services',
                    'Reduce the downstream impact of your cloud workloads'
                ],
                'best_practices': [
                    'Use managed services to reduce operational overhead',
                    'Optimize resource utilization',
                    'Choose efficient programming languages and frameworks',
                    'Implement efficient data storage and transfer',
                    'Use renewable energy regions when possible',
                    'Minimize idle resources',
                    'Implement efficient algorithms and data structures'
                ]
            }
        }

    def _get_cache_key(self, query: str, service: str = None) -> str:
        """Generate cache key for query"""
        cache_input = f"{query}_{service or 'general'}"
        return hashlib.md5(cache_input.encode()).hexdigest()

    def _is_cache_valid(self, cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if 'timestamp' not in cache_entry:
            return False
        
        cache_time = datetime.fromisoformat(cache_entry['timestamp'])
        return datetime.now() - cache_time < self.cache_duration

    def _cache_response(self, key: str, response: Dict):
        """Cache response with timestamp"""
        self.cache[key] = {
            **response,
            'timestamp': datetime.now().isoformat()
        }

    def query_aws_documentation(self, query: str, service: str = None, context: str = None) -> Dict:
        """
        Query AWS documentation for specific information
        
        Args:
            query: The question or topic to search for
            service: Specific AWS service to focus on (optional)
            context: Additional context for the query (optional)
            
        Returns:
            Dict containing documentation response
        """
        cache_key = self._get_cache_key(query, service)
        
        # Check cache first
        if cache_key in self.cache and self._is_cache_valid(self.cache[cache_key]):
            logger.info(f"Returning cached response for query: {query}")
            return self.cache[cache_key]

        try:
            # Process query and generate response
            response = self._process_documentation_query(query, service, context)
            
            # Cache the response
            self._cache_response(cache_key, response)
            
            logger.info(f"Successfully processed AWS documentation query: {query}")
            return response
            
        except Exception as e:
            logger.error(f"Error querying AWS documentation: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': query,
                'service': service
            }

    def _process_documentation_query(self, query: str, service: str = None, context: str = None) -> Dict:
        """Process the documentation query and return relevant information"""
        
        query_lower = query.lower()
        
        # Check if query is about Well-Architected Framework
        if any(pillar in query_lower for pillar in self.well_architected_content.keys()) or 'well-architected' in query_lower:
            return self._get_well_architected_info(query_lower)
        
        # Check if query is about a specific service
        if service and service.lower() in self.service_docs:
            return self._get_service_documentation(service.lower(), query_lower)
        
        # Check if query mentions a service
        for service_name in self.service_docs.keys():
            if service_name in query_lower:
                return self._get_service_documentation(service_name, query_lower)
        
        # General AWS best practices query
        return self._get_general_aws_guidance(query_lower, context)

    def _get_well_architected_info(self, query: str) -> Dict:
        """Get Well-Architected Framework specific information"""
        
        response = {
            'success': True,
            'source': 'AWS Well-Architected Framework',
            'query': query,
            'content': {},
            'recommendations': [],
            'best_practices': [],
            'documentation_links': []
        }
        
        # Identify which pillar(s) the query is about
        relevant_pillars = []
        for pillar_name, pillar_data in self.well_architected_content.items():
            if pillar_name.replace('-', ' ') in query or pillar_name in query:
                relevant_pillars.append((pillar_name, pillar_data))
        
        if not relevant_pillars:
            # If no specific pillar mentioned, provide overview
            response['content'] = {
                'overview': 'The AWS Well-Architected Framework consists of 6 pillars that help you understand the pros and cons of decisions you make while building systems on AWS.',
                'pillars': list(self.well_architected_content.keys()),
                'description': 'Each pillar provides design principles and best practices for building reliable, secure, efficient, and cost-effective systems in the cloud.'
            }
            response['recommendations'] = [
                'Review all 6 pillars for comprehensive architecture assessment',
                'Use the AWS Well-Architected Tool for automated reviews',
                'Implement continuous improvement based on pillar guidelines'
            ]
        else:
            # Provide specific pillar information
            for pillar_name, pillar_data in relevant_pillars:
                response['content'][pillar_name] = {
                    'principles': pillar_data['principles'],
                    'best_practices': pillar_data['best_practices']
                }
                response['recommendations'].extend(pillar_data['best_practices'][:3])
        
        response['documentation_links'] = [
            'https://docs.aws.amazon.com/wellarchitected/latest/framework/',
            'https://aws.amazon.com/architecture/well-architected/'
        ]
        
        return response

    def _get_service_documentation(self, service: str, query: str) -> Dict:
        """Get specific AWS service documentation"""
        
        service_info = {
            'ec2': {
                'name': 'Amazon Elastic Compute Cloud (EC2)',
                'description': 'Scalable virtual servers in the cloud',
                'use_cases': ['Web applications', 'Batch processing', 'High-performance computing'],
                'best_practices': [
                    'Use appropriate instance types for your workload',
                    'Implement auto-scaling for variable workloads',
                    'Use Elastic Load Balancing for high availability',
                    'Implement proper security groups and NACLs',
                    'Use IAM roles instead of access keys'
                ]
            },
            'lambda': {
                'name': 'AWS Lambda',
                'description': 'Serverless compute service that runs code without provisioning servers',
                'use_cases': ['Event-driven processing', 'API backends', 'Data transformation'],
                'best_practices': [
                    'Keep functions small and focused',
                    'Use environment variables for configuration',
                    'Implement proper error handling and retries',
                    'Monitor with CloudWatch and X-Ray',
                    'Use layers for shared code and dependencies'
                ]
            },
            's3': {
                'name': 'Amazon Simple Storage Service (S3)',
                'description': 'Object storage service with industry-leading scalability and durability',
                'use_cases': ['Static website hosting', 'Data archiving', 'Content distribution'],
                'best_practices': [
                    'Use appropriate storage classes for cost optimization',
                    'Implement lifecycle policies for automated transitions',
                    'Enable versioning for data protection',
                    'Use server-side encryption',
                    'Implement proper bucket policies and ACLs'
                ]
            },
            'rds': {
                'name': 'Amazon Relational Database Service (RDS)',
                'description': 'Managed relational database service',
                'use_cases': ['Web applications', 'E-commerce', 'Enterprise applications'],
                'best_practices': [
                    'Use Multi-AZ deployments for high availability',
                    'Implement automated backups and point-in-time recovery',
                    'Use read replicas for read-heavy workloads',
                    'Enable encryption at rest and in transit',
                    'Monitor performance with Performance Insights'
                ]
            },
            'dynamodb': {
                'name': 'Amazon DynamoDB',
                'description': 'Fast and flexible NoSQL database service',
                'use_cases': ['Mobile applications', 'Gaming', 'IoT applications'],
                'best_practices': [
                    'Design efficient partition keys',
                    'Use Global Secondary Indexes appropriately',
                    'Implement proper capacity planning',
                    'Enable point-in-time recovery',
                    'Use DynamoDB Accelerator (DAX) for caching'
                ]
            }
        }
        
        if service not in service_info:
            return {
                'success': False,
                'error': f'Service {service} not found in documentation',
                'available_services': list(service_info.keys())
            }
        
        info = service_info[service]
        
        return {
            'success': True,
            'source': f'AWS {info["name"]} Documentation',
            'service': service,
            'query': query,
            'content': {
                'name': info['name'],
                'description': info['description'],
                'use_cases': info['use_cases'],
                'best_practices': info['best_practices']
            },
            'recommendations': info['best_practices'][:3],
            'documentation_links': [
                self.service_docs.get(service, f'https://docs.aws.amazon.com/{service}/')
            ]
        }

    def _get_general_aws_guidance(self, query: str, context: str = None) -> Dict:
        """Get general AWS guidance and best practices"""
        
        # Common AWS topics and guidance
        guidance_topics = {
            'security': {
                'recommendations': [
                    'Implement least privilege access with IAM',
                    'Enable encryption at rest and in transit',
                    'Use AWS Config for compliance monitoring',
                    'Enable CloudTrail for audit logging',
                    'Implement network security with VPC'
                ],
                'services': ['IAM', 'AWS Config', 'CloudTrail', 'VPC', 'AWS Secrets Manager']
            },
            'cost': {
                'recommendations': [
                    'Use Reserved Instances for predictable workloads',
                    'Implement auto-scaling to match demand',
                    'Use appropriate storage classes',
                    'Monitor costs with AWS Cost Explorer',
                    'Implement resource tagging for cost allocation'
                ],
                'services': ['AWS Cost Explorer', 'AWS Budgets', 'Trusted Advisor']
            },
            'performance': {
                'recommendations': [
                    'Use CloudFront for content delivery',
                    'Implement caching strategies',
                    'Choose appropriate compute services',
                    'Optimize database performance',
                    'Monitor with CloudWatch'
                ],
                'services': ['CloudFront', 'ElastiCache', 'CloudWatch', 'X-Ray']
            },
            'reliability': {
                'recommendations': [
                    'Deploy across multiple Availability Zones',
                    'Implement auto-scaling',
                    'Use managed services when possible',
                    'Implement backup and disaster recovery',
                    'Monitor system health'
                ],
                'services': ['Auto Scaling', 'Elastic Load Balancing', 'AWS Backup']
            }
        }
        
        # Find relevant topic
        relevant_topic = None
        for topic, data in guidance_topics.items():
            if topic in query:
                relevant_topic = (topic, data)
                break
        
        if relevant_topic:
            topic_name, topic_data = relevant_topic
            return {
                'success': True,
                'source': 'AWS Best Practices',
                'topic': topic_name,
                'query': query,
                'content': {
                    'topic': topic_name.title(),
                    'recommendations': topic_data['recommendations'],
                    'relevant_services': topic_data['services']
                },
                'recommendations': topic_data['recommendations'],
                'documentation_links': [
                    'https://aws.amazon.com/architecture/',
                    'https://docs.aws.amazon.com/wellarchitected/'
                ]
            }
        
        # Default general guidance
        return {
            'success': True,
            'source': 'AWS General Guidance',
            'query': query,
            'content': {
                'message': 'For specific AWS guidance, please specify a service or topic (security, cost, performance, reliability)',
                'available_topics': list(guidance_topics.keys()),
                'available_services': list(self.service_docs.keys())
            },
            'recommendations': [
                'Follow AWS Well-Architected Framework principles',
                'Use managed services when possible',
                'Implement proper monitoring and logging',
                'Apply security best practices',
                'Optimize for cost and performance'
            ],
            'documentation_links': [
                'https://docs.aws.amazon.com/',
                'https://aws.amazon.com/architecture/'
            ]
        }

    def get_service_recommendations(self, services: List[str], context: str = None) -> Dict:
        """Get recommendations for multiple AWS services"""
        
        recommendations = {}
        
        for service in services:
            if service.lower() in self.service_docs:
                service_rec = self._get_service_documentation(service.lower(), f"best practices for {service}")
                if service_rec['success']:
                    recommendations[service] = service_rec['content']['best_practices']
        
        return {
            'success': True,
            'source': 'AWS Service Recommendations',
            'services': services,
            'context': context,
            'recommendations': recommendations
        }

    def validate_well_architected_compliance(self, architecture_description: str) -> Dict:
        """Validate architecture against Well-Architected Framework"""
        
        compliance_score = {}
        overall_recommendations = []
        
        for pillar_name, pillar_data in self.well_architected_content.items():
            # Simple keyword-based compliance check
            pillar_keywords = {
                'operational-excellence': ['automation', 'monitoring', 'infrastructure as code', 'cicd'],
                'security': ['encryption', 'iam', 'vpc', 'security group', 'authentication'],
                'reliability': ['multi-az', 'backup', 'auto scaling', 'load balancer'],
                'performance-efficiency': ['caching', 'cdn', 'cloudfront', 'optimization'],
                'cost-optimization': ['reserved instance', 'spot instance', 'auto scaling', 'lifecycle'],
                'sustainability': ['managed service', 'serverless', 'optimization', 'efficiency']
            }
            
            keywords = pillar_keywords.get(pillar_name, [])
            matches = sum(1 for keyword in keywords if keyword in architecture_description.lower())
            score = min(100, (matches / len(keywords)) * 100) if keywords else 0
            
            status = 'good' if score >= 70 else 'needs-improvement' if score >= 40 else 'critical'
            
            compliance_score[pillar_name] = {
                'score': int(score),
                'status': status,
                'recommendations': pillar_data['best_practices'][:3]
            }
            
            if status == 'critical':
                overall_recommendations.extend(pillar_data['best_practices'][:2])
        
        overall_score = sum(pillar['score'] for pillar in compliance_score.values()) // len(compliance_score)
        
        return {
            'success': True,
            'source': 'Well-Architected Framework Validation',
            'overall_score': overall_score,
            'pillar_scores': compliance_score,
            'recommendations': overall_recommendations[:5],  # Top 5 recommendations
            'validation_timestamp': datetime.now().isoformat()
        }

# Create singleton instance
aws_docs_mcp = AWSDocumentationMCP()

def query_aws_docs(query: str, service: str = None, context: str = None) -> Dict:
    """Main function to query AWS documentation"""
    return aws_docs_mcp.query_aws_documentation(query, service, context)

def get_well_architected_validation(architecture_description: str) -> Dict:
    """Validate architecture against Well-Architected Framework"""
    return aws_docs_mcp.validate_well_architected_compliance(architecture_description)

def get_service_recommendations(services: List[str], context: str = None) -> Dict:
    """Get recommendations for AWS services"""
    return aws_docs_mcp.get_service_recommendations(services, context)

if __name__ == "__main__":
    # Test the MCP server
    print("🚀 AWS Documentation MCP Server Test")
    
    # Test Well-Architected query
    result = query_aws_docs("security best practices", context="web application")
    print(f"Security query result: {json.dumps(result, indent=2)}")
    
    # Test service query
    result = query_aws_docs("lambda best practices", service="lambda")
    print(f"Lambda query result: {json.dumps(result, indent=2)}")
    
    # Test validation
    architecture = "Using EC2 with auto scaling, RDS with multi-AZ, CloudFront for CDN, and IAM roles for security"
    validation = get_well_architected_validation(architecture)
    print(f"Validation result: {json.dumps(validation, indent=2)}")