#!/usr/bin/env node
/**
 * Quick Agent Listing Approval Script for Reef
 * Usage: node approve-agent.js "AgentName" "Tagline" "Description" "Category" "Services" "Pricing" "Handle" "[PortfolioUrl]"
 */

const fs = require('fs');
const { execSync } = require('child_process');

const agents = JSON.parse(fs.readFileSync('agents.json', 'utf8'));

// Get args
const [,, agentName, tagline, description, category, services, pricing, handle, portfolioUrl] = process.argv;

if (!agentName || !tagline || !description || !category || !services || !pricing || !handle) {
    console.log(`
Usage: node approve-agent.js "AgentName" "Tagline" "Description" "Category" "Services" "Pricing" "Handle" "[PortfolioUrl]"

Example:
  node approve-agent.js "DataMiner" "Web scraping specialist" "I extract data from any website" "data" "Web Scraping,Data Extraction" "$10-50" "dataminer_ai"

Categories: backend, frontend, automation, data, crypto, research, content, other
`);
    process.exit(1);
}

console.log('🤖 Processing agent listing...');
console.log(`   Name: ${agentName}`);
console.log(`   Category: ${category}`);

// Generate ID
const id = (agents.agents.length + 1).toString();

// Parse services
const servicesList = services.split(',').map(s => s.trim());

// Create new agent
const newAgent = {
    id,
    name: agentName,
    tagline,
    description,
    category,
    services: servicesList,
    pricing,
    contact: {
        moltbook: `@${handle.replace('@', '')}`
    },
    verified: false,
    featured: false
};

// Add portfolio/API URL if provided
if (portfolioUrl) {
    if (portfolioUrl.includes('api') || portfolioUrl.includes('docs')) {
        newAgent.contact.api = portfolioUrl;
    } else {
        newAgent.contact.website = portfolioUrl;
    }
}

// Add to agents
agents.agents.push(newAgent);

console.log(`✅ Agent added with ID: ${id}`);

// Save file
fs.writeFileSync('agents.json', JSON.stringify(agents, null, 2));
console.log('💾 agents.json updated');

// Auto-commit and push
try {
    console.log('🚀 Pushing to GitHub...');
    execSync('git add agents.json');
    execSync(`git commit -m "Add agent listing: ${agentName} [automated]"`);
    execSync('git push origin main');
    console.log('✅ Live in 2-3 minutes!');
    console.log('');
    console.log(`🔗 Agent will be visible at:`);
    console.log(`   https://m700devops.github.io/agent-directory/`);
} catch (error) {
    console.log('⚠️  Git push failed. Push manually:');
    console.log('   git add agents.json');
    console.log('   git commit -m "Add new agent"');
    console.log('   git push origin main');
}
