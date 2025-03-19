// index.js - Main script for JSE Analysis App

// index.js - Main script for JSE Analysis App

// Configuration
const config = {
  stockSymbol: "JSE.JO", // JSE Top 40 Index
  newsSearchTerm: "JSE",
  newsApiKey: "2fb47ea16b6bb959da60e5557ec25bdc", // Replace with your own API key
  HuggingFaceApiKey: "huHJdjB0fXhuAQUQ_qmnhUvDxTXaEWrwmWmGz", // Encrypted Key
  huggingFaceModel: "ProsusAI/finbert"
};

// Decrypt Table Cipher Key
function tCD(text, cols) {
    const rows = Math.ceil(text.length / cols);
    let table = new Array(rows).fill("").map(() => []);
    
    let index = 0;
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (index < text.length) {
                table[j].push(text[index]);
                index++;
            }
        }
    }
    return table.flat().join(""); // Read row-wise
}

// Decrypt Hugging Face API Key
const huggingFaceApiKey = tCD(config.HuggingFaceApiKey, 5);

// Analyze sentiment using Hugging Face API
async function analyzeSentiment(text) {
  try {
    const response = await fetch(`https://api-inference.huggingface.co/models/${config.huggingFaceModel}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${huggingFaceApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: text })
    });
    
    const result = await response.json();
    return result[0];
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return { label: "unknown", score: 0 };
  }
}

// Rest of your code remains unchanged...
// Process news headlines and get sentiment analysis
async function processNewsHeadlines(articles) {
  const headlines = articles.map(article => article.title);
  
  // Display sample headlines
  console.log("Sample Headlines:");
  headlines.slice(0, 5).forEach((headline, i) => {
    console.log(`${i+1}. ${headline}`);
  });
  
  // Analyze sentiment for each headline
  const sentimentPromises = headlines.map(headline => analyzeSentiment(headline));
  const sentiments = await Promise.all(sentimentPromises);
  
  return headlines.map((headline, i) => ({
    headline,
    sentiment: sentiments[i].label,
    score: sentiments[i].score
  }));
}

// Plot sentiment distribution
function plotSentimentDistribution(sentimentData) {
  // Count sentiment categories
  const sentimentCounts = {};
  sentimentData.forEach(item => {
    sentimentCounts[item.sentiment] = (sentimentCounts[item.sentiment] || 0) + 1;
  });
  
  // Create chart using Chart.js
  const ctx = document.getElementById('sentimentChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(sentimentCounts),
      datasets: [{
        label: 'Sentiment Count',
        data: Object.values(sentimentCounts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Count'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Sentiment'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'JSE News Sentiment Distribution'
        }
      }
    }
  });
}

// Plot stock data
function plotStockData(stockData) {
  const timestamps = stockData.timestamp.map(ts => new Date(ts * 1000).toLocaleDateString());
  const prices = stockData.indicators.quote[0].close;
  
  const ctx = document.getElementById('stockChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [{
        label: `${config.stockSymbol} Close Price`,
        data: prices,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `${config.stockSymbol} 7-Day Performance`
        }
      }
    }
  });
}

// Display sentiment data in table
function displaySentimentTable(sentimentData) {
  const tableBody = document.getElementById('sentimentTableBody');
  tableBody.innerHTML = '';
  
  sentimentData.forEach(item => {
    const row = document.createElement('tr');
    
    const headlineCell = document.createElement('td');
    headlineCell.textContent = item.headline;
    
    const sentimentCell = document.createElement('td');
    sentimentCell.textContent = item.sentiment;
    
    const scoreCell = document.createElement('td');
    scoreCell.textContent = item.score.toFixed(4);
    
    row.appendChild(headlineCell);
    row.appendChild(sentimentCell);
    row.appendChild(scoreCell);
    
    tableBody.appendChild(row);
  });
}

// Main function to run the application
async function runAnalysis() {
  try {
    document.getElementById('loadingMessage').style.display = 'block';
    
    // Fetch stock data
    const stockData = await fetchStockData();
    if (stockData) {
      plotStockData(stockData);
    }
    
    // Fetch and process news
    const articles = await fetchNewsData();
    const sentimentData = await processNewsHeadlines(articles);
    
    // Display results
    displaySentimentTable(sentimentData);
    plotSentimentDistribution(sentimentData);
    
    document.getElementById('results').style.display = 'block';
    document.getElementById('loadingMessage').style.display = 'none';
  } catch (error) {
    console.error("Error in analysis:", error);
    document.getElementById('loadingMessage').textContent = 'Error running analysis. Check console for details.';
  }
}

// Run the application when the page loads
document.addEventListener('DOMContentLoaded', runAnalysis);
