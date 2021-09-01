import state from "../model.js";
import { formatCurrency, formatReadableDate } from "../helpers.js";
import { MacroInvestment } from "../investmentsLogic.js";
import { formatState } from "./treemap.js";

// Export 1 function that loads the markup and creates all the event listeners for that page

// //////// VARIABLES

// Get data from state

// //////// FUNCTIONS

function generateMarkup() {
  return `
    <div class="portfolio-summary-view">

                <h1 class="port-header">Portfolio Dashboard</h1>

                <div class="port-summary-container">
                    <div>
                        <p class="port-value">$0</p>
                        <label for="port-value">Current portfolio value</label>
                    </div>

                    <div>
                        <p class="start-value">$0</p>
                        <label for="start-value">Total original investment(s)</label>
                    </div>

                    <div>
                        <p class="value-change">0%</p>
                        <label for="value-change">Percentage change</label>
                    </div>

                    <div>
                        <p class="sold-pos">$0</p>
                        <label for="sold-pos">Total sold positions</label>
                    </div>
                </div>

                <div class="asset-balances-container">
                    <div class="wrapper">
                        <label for="asset-balances-table">
                            <h2>Balances:</h2>
                        </label>
                        <div class="asset-balances">
                            <table class="asset-balances-table">
                                <tr>
                                    <th>Asset</th>
                                    <th>Asset Amount</th>
                                    <th>Value</th>
                                    <th>Portfolio %</th>
                                </tr>
                                

                            </table>
                        </div>
                    </div>

                    <div class="sunburst-diag">
                      <svg id="sun-burst" class="sun-burst">
                      </svg>
                    </div>

                </div>

                <div class="port-movements-container">
                    <label for="port-movements-table">
                        <h2 style="margin: 0.75rem 1rem;">Portfolio movements:</h2>
                    </label>
                    <div class="port-movements">
                        <table class="port-movements-table">
                            <tr>
                                <th>Date</th>
                                <th>Asset</th>
                                <th>Transaction</th>
                                <th>Value</th>
                                <th>Asset amount</th>
                            </tr>
                            
                        </table>
                    </div>
                </div>

            </div>
    `;
}

// Calculate balances obtained from portfolio
function calcBalances() {
  // Inintialize values
  let portValue = 0;
  let totalInvested = 0;
  let change = 0;
  let totalSold = 0;

  // Loop array & add to variables
  state.assetClasses.forEach((invest) => {
    portValue += invest.currentValue;
    totalInvested += invest.totalInvested;

    if (invest.soldPositions.length !== 0) {
      invest.soldPositions.forEach((item) => {
        totalSold += item.sellValue;
      });
    }
  });

  totalInvested === 0
    ? (change = 0)
    : (change = ((portValue - totalInvested) / totalInvested) * 100);

  return { portValue, totalInvested, change, totalSold };
}

// Generate portfolio summary data
function generatePortSummary() {
  // Setting to variable instead of calling multiple times
  const balances = calcBalances();

  // Select html elements
  const portValueEl = document.querySelector(".port-value");
  const originalValueEl = document.querySelector(".start-value");
  const changeEl = document.querySelector(".value-change");
  const totalSoldEl = document.querySelector(".sold-pos");

  console.log(`balance`, balances);

  portValueEl.innerText = `${formatCurrency(balances.portValue)}`;
  originalValueEl.innerText = `${formatCurrency(balances.totalInvested)}`;
  changeEl.innerHTML =
    balances.change > 0
      ? `<span class="green">+${balances.change.toFixed(2)}%</span>`
      : `<span class="red">${balances.change.toFixed(2)}%</span>`;
  totalSoldEl.innerText = `${formatCurrency(balances.totalSold)}`;
}

// Generate portfolio balance summary table elements
function populateBalancesTable() {
  const balances = calcBalances();

  const table = document.querySelector(".asset-balances-table");
  const portTotal = balances.portValue;

  state.assetClasses.forEach((invest) => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${invest.asset}</td>
            <td>${invest.assetAmount}</td>
            <td>${formatCurrency(invest.currentValue)}</td>
            <td>${((invest.currentValue / portTotal) * 100).toFixed(2)}%</td>
        `;

    // console.log((invest.currentValue / portTotal) * 100);
    table.appendChild(row);
  });

  //   console.log(portTotal);
}

// Populate portfolio movements table
function populateMovementsTable() {
  const table = document.querySelector(".port-movements-table");

  const tableItems = [];

  // Sold positions
  state.assetClasses.forEach((asset) => {
    if (asset.soldPositions.length !== 0) {
      asset.soldPositions.forEach((sold) => {
        sold.asset = asset.asset;
        tableItems.push(sold);
      });
    }

    // HODL positions
    if (asset.macros.length !== 0) {
      tableItems.push(...asset.macros);
    }
  });

  tableItems.sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log(`tttttttt`, tableItems);

  tableItems.forEach((item) => {
    if (item instanceof MacroInvestment) {
      const row = document.createElement("tr");
      // row.classList.add('sell')

      row.innerHTML = `
        <td>${formatReadableDate(item.date, true)}</td>
        <td>${item.asset}</td>
        <td><span class="green">Buy</span></td>
        <td>${formatCurrency(item.originalCapital)}</td>
        <td>${item.assetAmount}</td>
        `;
      table.appendChild(row);
    } else {
      const row = document.createElement("tr");
      row.classList.add("sell");

      row.innerHTML = `
      <td>${formatReadableDate(item.date, true)}</td>
      <td>${item.asset}</td>
      <td><span class="red">Sell</span></td>
      <td>${formatCurrency(item.sellPrice)}</td>
      <td>${item.assetAmount}</td>
      `;

      table.appendChild(row);
    }
  });
}

function renderSunburst() {
  const data = formatState();

  const svg = d3.select("#sun-burst");

  const container = document.querySelector(".sunburst-diag");

  const height = Math.min(container.clientHeight * 0.9, container.clientWidth);
  svg.attr("width", height);
  svg.attr("height", height);

  const radius = height / 2;

  const hierarchy = d3.hierarchy(data).sum((d) => d.currentValue);

  const root = d3.partition().size([2 * Math.PI, radius])(hierarchy);

  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius / 2)
    .innerRadius((d) => d.y0)
    .outerRadius((d) => d.y1 - 1);

  const color = d3.scaleOrdinal(
    d3.quantize(d3.interpolateCool, data.children.length + 1)
  );

  const g = svg.append("g").attr("transform", `translate(${radius},${radius})`);

  g.append("g")
    .selectAll("path")
    .data(
      root
        .descendants()
        .filter((d) => d.depth && d.parent.children.length !== 1)
    )
    .join("path")
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("d", arc)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .append("title")
    // Following function appends different text based on whether the node is a leaf or a parent w/ either 1 child or more than 1 child
    .text(function (d) {
      if (d.children && d.children.length === 1) {
        return `${d.data.children[0].name} (${formatReadableDate(
          d.data.children[0].date
        )})\nValue: ${formatCurrency(
          d.data.children[0].currentValue
        )}\nInitial Investment: ${formatCurrency(
          d.data.children[0].originalCapital
        )}
        `;
      } else if (d.children && d.children.length !== 1) {
        return;
      } else {
        return `${d.data.name} (${formatReadableDate(
          d.data.date
        )})\nValue: ${formatCurrency(
          d.data.currentValue
        )}\nInitial Investment: ${formatCurrency(d.data.originalCapital)}
        `;
      }
    });

  g.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .selectAll("text")
    .data(
      root
        .descendants()
        .filter(
          (d) =>
            d.depth === 1 &&
            d.value > d3.max(root.descendants(), (d) => d.value) * 0.04
        )
    )
    .join("text")
    .attr("transform", function (d) {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = (d.y0 + d.y1) / 2;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    })
    .attr("dy", "0.35em")
    .text((d) => d.data.name);
}

// Add the default html to the page
export const renderPortfolioDashboardMarkup = function (parentEl) {
  parentEl.innerHTML = generateMarkup();
  generatePortSummary();
  populateBalancesTable();
  populateMovementsTable();
  renderSunburst();
};
