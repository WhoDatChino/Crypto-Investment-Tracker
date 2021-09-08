"use strict";

import state from "../model.js";
import {
  formatCurrency,
  formatReadableDate,
  formatShortCurrency,
  showSuccessPopup,
  checkRequired,
  checkDate,
} from "../helpers.js";
import { showOverlay, hideOverlayRemoveSibling } from "./treemap.js";

// function viewIndividualInvest() {
//   const tbody = document.querySelector(".investment-table tbody");

//   tbody.addEventListener("click", function (e) {
//     const target = e.target.closest("tr").dataset.id;

//     console.log(target);
//   });
// }

function showInvestment(macro) {
  // Parent to which eveything is appended
  const parent = document.querySelector(".views-container");

  // Coin in curMarket that matches one fed into function
  const marketCoin = state.curMarket.find((coin) => coin.name === macro.asset);

  const overlay = document.querySelector(".overlay");

  // 1st popup
  investInspect(macro);

  // ///// Lexical functions

  function investInspect(macro) {
    // Create popup and shows overlay
    function generatePopup(data) {
      let changeHTML;

      // Different html added based on wether or not the asset is sold
      if (data.sold) {
        // Get data of sale
        const sellData = state.assetClasses
          .find((assClass) => assClass.asset === data.asset)
          .soldPositions.find((obj) => obj.id === data.id);

        changeHTML = `
              <p>Value at sale:</p>
              <p class="investment-data"> ${formatCurrency(
                sellData.assetAmount * sellData.sellPrice
              )}</p>
              `;
      } else {
        const change =
          ((data.currentValue - data.originalCapital) / data.originalCapital) *
          100;

        changeHTML =
          change > 0
            ? `
                <p>Change:</p>
                <p class="investment-data">
                <span class="green">+${change.toFixed(2)}%</span></p>`
            : `<p>Change:</p>
            <p class="investment-data"><span class="red">${change.toFixed(
              2
            )}%</span></p>`;
      }

      showOverlay(overlay);

      const investInspect = document.createElement("div");
      investInspect.classList.add("investment-inspection-container");

      investInspect.innerHTML = `
                    
                        <button class="close-modalBTN">
                            <ion-icon name="close-outline"></ion-icon>
                        </button>
                        <div class="form-header">
                            <h1>${data.asset}</h1>
                        </div>
                        <div class="investment-inspection-info">
        
                            <p>Date of investment:</p>
                            <p class="investment-data">${formatReadableDate(
                              data.date
                            )}</p>
                            <p>Coin Amount:</p>
                            <p class="investment-data">${data.assetAmount}</p>
                            <p>Original investment:</p>
                            <p class="investment-data">${formatCurrency(
                              data.originalCapital
                            )}</p>
                            <p>Current value of investment:</p>
                            <p class="investment-data">${formatCurrency(
                              data.currentValue
                            )}</p>
                            ${changeHTML}
                            <p>Current price of coin:</p>
                            <p class="investment-data">${formatCurrency(
                              marketCoin.current_price,
                              6
                            )}</p>
                        </div>
        
                        <div class="investment-interactions">
                            <div class="button-and-label">
                                <input type="checkbox" name="check1" class="check" id="checkbox">
                                <label for="checkbox" class="checkmark"></label>
        
                                <label class="description" for="checkbox">Mark as sold</label>
                            </div>
                            <div class="button-and-label">
                                <button class="delete">
                                    <ion-icon name="trash-outline"></ion-icon>
                                </button>
                                <label class="description" for="delete">Delete</label>
                            </div>
        
                        </div>
                    `;

      parent.append(investInspect);
    }
    generatePopup(macro);

    function updatePopup(data) {
      let changeHTML;

      // Different html added based on wether or not the asset is sold
      if (data.sold) {
        // Get data of sale
        const sellData = state.assetClasses
          .find((assClass) => assClass.asset === data.asset)
          .soldPositions.find((obj) => obj.id === data.id);

        changeHTML = `
            <p>Value at sale:</p>
            <p class="investment-data"> ${formatCurrency(
              sellData.assetAmount * sellData.sellPrice
            )}</p>
            `;
      } else {
        const change =
          ((data.currentValue - data.originalCapital) / data.originalCapital) *
          100;

        changeHTML =
          change > 0
            ? `
                <p>Change:</p>
                <p class="investment-data">
                <span class="green">+${change.toFixed(2)}%</span></p>`
            : `<p>Change:</p>
            <p class="investment-data"><span class="red">${change.toFixed(
              2
            )}%</span></p>`;
      }

      document.querySelector(".investment-inspection-info").innerHTML = `
        <p>Date of investment:</p>
        <p class="investment-data">${formatReadableDate(data.date)}</p>
        <p>Coin Amount:</p>
        <p class="investment-data">${data.assetAmount}</p>
        <p>Original investment:</p>
        <p class="investment-data">${formatCurrency(data.originalCapital)}</p>
        <p>Current value of investment:</p>
        <p class="investment-data">${formatCurrency(data.currentValue)}</p>
        ${changeHTML}
        <p>Current price of coin:</p>
        <p class="investment-data">${formatCurrency(
          marketCoin.current_price,
          6
        )}</p>
        `;
    }

    // Find the MacroInvestment associated with leaf clicked
    function findMacro(data) {
      return state.assetClasses
        .find((asset) => asset.asset === data.asset)
        .macros.find((invest) => invest.id === data.id);
    }
    const stateMacro = findMacro(macro);

    // Creates sellInvestment form & logic
    function sellInvestForm() {
      const form = document.createElement("div");
      form.className = "sell-form-container";

      form.innerHTML = `
          <div class="sell-popup" onclick="event.stopPropagation()">
        
              <div class="form-header">
                  <h1>Sell Investment</h1>
              </div>
        
              <form class="sell-investment-form">
                  <label for="dueDate">Date and time of sale:</label>
                  <div class="input-data">
                      <input type="datetime-local" name="Date" class="due-date">
                      <small>Message</small>
                  </div>
      
                  <label for="sell-price">Price of coin at sale ($):</label>
                  <div class="input-data">
                      <input type="number" name="Purchase Price" class="sell-price" min="0"
                          placeholder='Optional - include for better accuracy' step='0.00000001'>
                      <small>Message</small>
                  </div>
      
                  <div class="action-btns">
                      <button type="submit" class="add-btn">Confirm</button>
                      <button type="button" class="cancel-btn">Cancel</button>
                  </div>
              </form>
          </div>
        
          `;

      parent.append(form);

      // ////Sell form functions
      function closeSaleForm() {
        const investInspect = document.querySelector(
          ".investment-inspection-container"
        );
        investInspect.classList.remove("move");
        form.remove();
      }

      function formSubmitter(e) {
        e.preventDefault();
        const dateInput = form.querySelector(".due-date");
        const sellPriceInput = form.querySelector(".sell-price");

        // Checks inputs to see if they are valid to sell asset
        function validateInputs() {
          let valid = 0;
          valid += checkRequired([dateInput]);
          valid += checkDate(dateInput);

          if (valid === 0) sellMacro();
        }

        // retrieves price of coin at sale from user or api
        async function getSellPrice() {
          if (sellPriceInput.value !== 0 && sellPriceInput.value !== "")
            return +sellPriceInput.value;

          try {
            const dateString = new Date(dateInput.value).toISOString();
            const coin = marketCoin.symbol.toUpperCase();
            const apiKey = `923F38CF-FBE2-49B9-A382-C9B12A0B96A7`;

            const req = await fetch(
              `https://rest.coinapi.io/v1/exchangerate/${coin}/USD?time=${dateString}&apikey=${apiKey}`
            );

            if (!req.ok) {
              throw req.status;
            }

            const data = await req.json();

            console.log(`SellPrice DATA`, data);
            return data.rate;
          } catch (err) {
            throw err;
          }
        }

        // Performs action of actually selling the MacroInvestment
        async function sellMacro() {
          try {
            // 1. get the date input
            // 2. Get the sellPrice input
            //  - if there is no input, make a call to api using date info and current coin
            //  - display loader
            // 3. With date and price info, call .markSold({date,sellPrice}) on macro
            const props = {
              date: dateInput.value,
              sellPrice: await getSellPrice(),
            };

            stateMacro.markSold(props);
            // 5. Close sale form and show investInspect
            updatePopup(findMacro(macro));
            closeSaleForm();
          } catch (err) {
            alert(`problem getting sellPrice: (${err})`, err);
          }
        }

        validateInputs();
      }

      // ////Sell form eventListeners
      // Form submission
      form.addEventListener("submit", formSubmitter);

      // Close form
      form.querySelector(".cancel-btn").addEventListener("click", function (e) {
        closeSaleForm();
        document.querySelector("#checkbox").checked = false;
      });
    }

    // Called when checkbox clicked
    function sellOrUnsell() {
      // Bring up sale popup
      if (this.checked) {
        // transisition inspection modal away
        document
          .querySelector(".investment-inspection-container")
          .classList.add("move");
        // Display sell form & logic
        sellInvestForm();
      } else {
        // Unsell invest
        stateMacro.markUnsold();
        updatePopup(stateMacro);
      }
    }

    // //// EventListeners for investInspect

    // Close investInspect
    document
      .querySelector(".close-modalBTN")
      .addEventListener("click", hideOverlayRemoveSibling);

    overlay.addEventListener("click", hideOverlayRemoveSibling);
    // Mark sold (checkbox)
    document.querySelector("#checkbox").addEventListener("click", sellOrUnsell);
  }

  // /////////////////////////////////////////////////////////////////

  // Gets the obj in state associated w/ leaf clicked (macro)

  // Marks macro sold or unsold and updates state

  // Displays form to sell investment - called when check box is checked

  // /// Functions for sellInvestPopup

  function sellFormValidator(e) {
    console.log(`hello`);
    e.preventDefault();

    const date = document.querySelector(".due-date");
    const sellPrice = document.querySelector(".sell-price");

    // Code copied from formValidator in treemap
    let valid = 0;

    // Checks to see if all the required fields have a value
    function checkRequired(inputArr) {
      inputArr.forEach((input) => {
        if (input.value.trim() === "") {
          showError(input, `${getFieldName(input)} is required`);
          valid++;
        } else {
          showSuccess(input);
        }
      });
    }

    function showError(input, message) {
      const parent = input.parentElement;

      parent.className = "input-data error";
      parent.querySelector("small").innerText = message;
    }

    function showSuccess(input) {
      input.parentElement.className = "input-data";
    }

    function getFieldName(input) {
      return input.getAttribute("name");
    }

    checkRequired([date, sellPrice]);
  }

  // /// eventListeners for sellInvestPopup

  // Close the modal
  //   document.querySelector(".cancel-btn").addEventListener("click", closePopup);
  //   document
  //     .querySelector(".sell-form-container")
  //     .addEventListener("click", closePopup);

  // Submit the modal
  //   document.querySelector(".add-btn").addEventListener("submit", function (e) {
  //     e.preventDefault();
  //     console.log(`2snfdndfjno`);
  //   });

  // ///// Event listeners

  // 1. Hide the popup

  // 2. Sell the asset
  //   document.querySelector("#checkbox").addEventListener("click", sellOrUnsell);

  // 3. Delete the asset
}

export const renderIndividInvest = function (data) {
  // 1. Display overlay and individual investment inspection popup
  showInvestment(data);
};
