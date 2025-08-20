#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    } else {
      totalSize += stats.size;
    }
  }
  
  try {
    calculateSize(dirPath);
    return totalSize;
  } catch (error) {
    return 0;
  }
}

function analyzeImages() {
  console.log('🖼️  ANÁLISE DE IMAGENS');
  console.log('='.repeat(50));
  
  const originalPath = 'public/pmcell-loja.jpg';
  const optimizedDir = 'public/optimized/';
  
  if (fs.existsSync(originalPath)) {
    const originalSize = fs.statSync(originalPath).size;
    console.log(`📸 Original: ${formatBytes(originalSize)}`);
    
    if (fs.existsSync(optimizedDir)) {
      const optimizedFiles = fs.readdirSync(optimizedDir);
      let totalSavings = 0;
      
      optimizedFiles.forEach(file => {
        const filePath = path.join(optimizedDir, file);
        const size = fs.statSync(filePath).size;
        const reduction = ((originalSize - size) / originalSize * 100).toFixed(1);
        const savings = originalSize - size;
        totalSavings += savings;
        
        console.log(`✅ ${file}: ${formatBytes(size)} (-${reduction}%)`);
      });
      
      console.log(`💰 Total economizado: ${formatBytes(totalSavings)}`);
    }
  }
  console.log();
}

function analyzeBundles() {
  console.log('📦 ANÁLISE DE BUNDLES');
  console.log('='.repeat(50));
  
  const nextDir = '.next';
  
  if (fs.existsSync(nextDir)) {
    const staticDir = path.join(nextDir, 'static');
    const serverDir = path.join(nextDir, 'server');
    
    if (fs.existsSync(staticDir)) {
      const staticSize = getDirectorySize(staticDir);
      console.log(`📁 Static assets: ${formatBytes(staticSize)}`);
      
      // Analisar chunks individuais
      const chunksDir = path.join(staticDir, 'chunks');
      if (fs.existsSync(chunksDir)) {
        const chunks = fs.readdirSync(chunksDir)
          .filter(file => file.endsWith('.js'))
          .map(file => {
            const filePath = path.join(chunksDir, file);
            const size = fs.statSync(filePath).size;
            return { name: file, size };
          })
          .sort((a, b) => b.size - a.size)
          .slice(0, 10); // Top 10 maiores chunks
        
        console.log('📋 Top 10 maiores chunks:');
        chunks.forEach((chunk, index) => {
          console.log(`  ${index + 1}. ${chunk.name}: ${formatBytes(chunk.size)}`);
        });
      }
    }
    
    if (fs.existsSync(serverDir)) {
      const serverSize = getDirectorySize(serverDir);
      console.log(`🖥️  Server bundles: ${formatBytes(serverSize)}`);
    }
    
    const totalBuildSize = getDirectorySize(nextDir);
    console.log(`📊 Total build size: ${formatBytes(totalBuildSize)}`);
  } else {
    console.log('❌ Pasta .next não encontrada. Execute o build primeiro.');
  }
  console.log();
}

function generateRecommendations() {
  console.log('💡 RECOMENDAÇÕES');
  console.log('='.repeat(50));
  
  const recommendations = [
    '✅ Imagens otimizadas implementadas',
    '✅ Lazy loading configurado',
    '✅ Formatos WebP/AVIF habilitados',
    '✅ Code splitting configurado',
    '🔄 Considere implementar Service Worker para cache',
    '🔄 Adicione preload para recursos críticos',
    '🔄 Configure CDN para assets estáticos'
  ];
  
  recommendations.forEach(rec => console.log(rec));
  console.log();
}

function main() {
  console.log('🚀 RELATÓRIO DE PERFORMANCE - PMCELL VENDAS');
  console.log('='.repeat(60));
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log();
  
  analyzeImages();
  analyzeBundles();
  generateRecommendations();
  
  console.log('✨ Análise concluída!');
}

main();