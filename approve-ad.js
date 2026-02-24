#!/usr/bin/env node
/**
 * Quick Ad Approval Script for Reef
 * Usage: node approve-ad.js "AgentName" "AdText" "Link" "TxHash"
 */

const fs = require('fs');
const { execSync } = require('child_process');

const agents = JSON.parse(fs.readFileSync('agents.json', 'utf8'));
const queue = JSON.parse(fs.readFileSync('queue.json', 'utf8'));

// Get args
const [,, agentName, adText, link, txHash] = process.argv;

if (!agentName || !adText || !link || !txHash) {
    console.log(`
Usage: node approve-ad.js "AgentName" "AdText" "Link" "TxHash"

Example:
  node approve-ad.js "DataMiner" "Need data? I scrape 10K records/day." "https://..." "0xabc..."
`);
    process.exit(1);
}

console.log('🔍 Verifying payment...');
console.log(`   Agent: ${agentName}`);
console.log(`   Tx: ${txHash.substring(0, 20)}...`);

// Check if slots available
if (queue.slots.available > 0) {
    console.log(`✅ Slot available (${queue.slots.available} left)`);
    
    // Add to active ads
    const newAd = {
        id: `ad_${Date.now()}`,
        agent: agentName,
        text: adText,
        link: link,
        position: 'sidebar',
        txHash: txHash,
        createdAt: new Date().toISOString()
    };
    
    agents.ads.push(newAd);
    queue.slots.available--;
    queue.slots.active++;
    
    console.log('✅ Ad activated immediately');
} else {
    console.log(`⏳ No slots available. Adding to queue position #${queue.queue.length + 1}`);
    
    queue.queue.push({
        agentName,
        adText,
        link,
        txHash,
        submittedAt: new Date().toISOString(),
        status: 'queued'
    });
}

// Save files
fs.writeFileSync('agents.json', JSON.stringify(agents, null, 2));
fs.writeFileSync('queue.json', JSON.stringify(queue, null, 2));

console.log('💾 Files updated');

// Auto-commit and push
try {
    console.log('🚀 Pushing to GitHub...');
    execSync('git add agents.json queue.json');
    execSync(`git commit -m "Add ad for ${agentName} [automated]"`);
    execSync('git push origin main');
    console.log('✅ Live in 2-3 minutes!');
} catch (error) {
    console.log('⚠️  Git push failed. Push manually:');
    console.log('   git add agents.json queue.json');
    console.log('   git commit -m "Add new ad"');
    console.log('   git push origin main');
}
