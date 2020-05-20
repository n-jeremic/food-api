const apiKey = "791d9715b9454e049e21c5c9b46ca8df";
// const apiKey = "1fa9fd007ea14a9db14691c266865645";
let searchResultsGlobal;
let chatbotDisplayed = false;

$(function () {
  $('[data-toggle="tooltip"]').tooltip();
});

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

async function initApp() {
  createShoppingListTab();
  createFavouriteRecipesTab();
  await getRandomRecipes();
  createHistoryList(true, "historyTab");
}

function displayRemoveBtn(ingredient_id) {
  $(`#remove-ingredient-btn-${ingredient_id}`).css("visibility", "visible");
}

function hideRemoveBtn(ingredient_id) {
  $(`#remove-ingredient-btn-${ingredient_id}`).css("visibility", "hidden");
}

function createShoppingListTab(displayMainTab = false) {
  const listLS = localStorage.getItem("shoppingList");
  if (listLS) {
    let number = 0;
    const listObj = JSON.parse(listLS);
    if (listObj.ingredients !== undefined && listObj.ingredients.length > 0) {
      number += listObj.ingredients.length;
      let ingredientsList = "";
      listObj.ingredients.forEach((ingredient) => {
        ingredientsList += `<li class="list-group-item list-group-item-action groceries-list-hover" style="background-color: #eaeae1;" onmouseover="displayRemoveBtn(${ingredient.id});" onmouseleave="hideRemoveBtn(${
          ingredient.id
        });"><img width="50px" class="mr-3 shadow-sm rounded" height="50px" src="https://spoonacular.com/cdn/ingredients_250x250/${ingredient.image}">${ingredient.name.capitalize()}<button type="button" id="remove-ingredient-btn-${
          ingredient.id
        }" class="close float-right" style="margin-top: 11px; visibility: hidden;" aria-label="Close" onclick="removeFromShoppingList(${ingredient.id}, 'ingredients')">
        <span aria-hidden="true">&times;</span>
        </button></li>`;
      });

      $("#groceries-list-group").empty();
      $("#groceries-list-group").append(ingredientsList);
      $("#groceries-list-container").css("display", "block");
    } else {
      $("#groceries-list-container").css("display", "none");
    }

    if (listObj.wines !== undefined && listObj.wines.length > 0) {
      number += listObj.wines.length;
      let winesList = "";
      listObj.wines.forEach((wine) => {
        winesList += `<button type="button" data-toggle="modal" data-target="#myModal" data-toggle="tooltip" data-placement="top" title="Click for more details" class="list-group-item list-group-item-action" onclick="getWineDetailsModal(${wine.id})">${wine.title}</button>`;
      });

      $("#wines-list-group").empty();
      $("#wines-list-group").append(winesList);
      $('[data-toggle="tooltip"]').tooltip();
      $("#wines-list-container").css("display", "block");
    } else {
      $("#wines-list-container").css("display", "none");
    }

    $("#shopList-badge").text(number);

    if (number > 0) {
      $("#no-list-title").css("display", "none");
    } else {
      $("#groceries-list-container").css("display", "none");
      $("#wines-list-container").css("display", "none");
      $("#no-list-title").css("display", "block");
    }
  } else {
    $("#groceries-list-container").css("display", "none");
    $("#wines-list-container").css("display", "none");
    $("#shopList-badge").text("0");
    $("#no-list-title").css("display", "block");
  }

  if (displayMainTab) {
    $("#history-card").css("display", "none");
  }
}

function createFavouriteRecipesTab() {
  const recipesJSON = localStorage.getItem("favouriteRecipes");
  if (recipesJSON) {
    const recipesArr = JSON.parse(recipesJSON);
    if (recipesArr.length > 0) {
      $("#no-recipes-title").css("display", "none");
      let cardsMarkup = "";
      recipesArr.forEach((recipe) => {
        cardsMarkup += `<div class="col-lg-6 mb-4"><div class="card shadow-sm" style="border: none">
        <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}-img">
        <div class="card-body" style="padding: 10px !important; border: 1px solid rgba(0,0,0,.125); border-radius: 0 0 .25rem .25rem; border-top: none;">
          <h5 class="card-title text-center mb-4">${recipe.title}</h5>
          <button class="btn btn-danger btn-sm float-right ml-3" onclick="removeFavouriteRecipe(${recipe.id});"><i class="far fa-trash-alt mr-1"></i>Remove</button>
          <button class="btn btn-warning btn-sm float-right" onclick="getRecipeInfo(${recipe.id}, this, 'favouritesTab')"><i class="fas fa-info-circle mr-1"></i>More info</button>
        </div>
      </div></div>`;
      });

      $("#favRecipes-mainRow").empty();
      $("#favRecipes-mainRow").append(cardsMarkup);
    } else {
      $("#favRecipes-mainRow").empty();
      $("#no-recipes-title").css("display", "block");
    }

    $("#favRecipes-badge").text(recipesArr.length);
  } else {
    $("#favRecipes-badge").text("0");
  }

  $("#history-card").css("display", "none");
}

async function getRandomRecipes() {
  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/random?number=12&apiKey=${apiKey}`);
    const responseParsed = await response.json();

    $("#main-spinner").css("display", "none");
    responseParsed.recipes.forEach((recipe) => createRandomRecipeCard(recipe));
    console.log(responseParsed);
  } catch (err) {
    console.log(err);
  }
}

function createRandomRecipeCard(recipeObj) {
  const dietMarkUp = createDietIcons(recipeObj);
  const dishTypes = modifyDishType(recipeObj.dishTypes);

  const markUp = `<div class="col-lg-4 mb-5">
        <div class="card shadow card--hover">
        <img src="${recipeObj.image !== undefined ? recipeObj.image : "http://placehold.it/556x370"}" class="card-img-top" alt="..." style="object-fit: cover" />
        <div class="card-body recipe-card">
            <h4 class="card-title text-center">${recipeObj.title}</h4>
            ${dishTypes.length > 0 ? '<p class="alert alert-success alert-modified" role="alert">Dish type: ' + dishTypes + "</p>" : ""}
            <p class="alert alert-warning alert-modified" role="alert">Cooking time: ${recipeObj.readyInMinutes} minutes</p>
            <div style="padding-left: 5px !important">
                <p>Health score: <span ${recipeObj.healthScore > 60 ? 'class="badge badge-success text-wrap"' : 'class="badge badge-warning text-wrap"'}>${recipeObj.healthScore} %</span></p>
                <p>Spoonacular score: <span ${recipeObj.spoonacularScore > 60 ? 'class="badge badge-success text-wrap"' : 'class="badge badge-warning text-wrap"'}>${recipeObj.spoonacularScore} %</span></p>
            </div>
            <p style="margin-top: 10px; margin-bottom: 10px">${dietMarkUp}</p>
            <button class="btn btn-warning btn-block btn-sm" onclick="getRecipeInfo(${recipeObj.id}, this, 'randomRecipesTab')"><i class="fas fa-info-circle mr-1"></i>More info</button>
        </div>
        </div>
    </div>`;

  $("#randomRecipes-tab").append(markUp);
  $('[data-toggle="tooltip"]').tooltip();
}

function createDietIcons(recipeObj, recipeInfoTab = false) {
  let dietMarkUp = "";
  let recipeInfoData = "";
  if (recipeObj.vegetarian) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #ff9900; margin: 5px; border: 2px solid #ff9900; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Vegetarian'><i class='fas fa-carrot'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Vegetarian</p>';
  }

  if (recipeObj.vegan) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #00cc00; margin: 5px; border: 2px solid #00cc00; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Vegan'><i class='fas fa-leaf'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Vegan</p>';
  }

  if (recipeObj.glutenFree) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #6699ff; margin: 5px; border: 2px solid #6699ff; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Gluten Free'><i class='fas fa-seedling'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Gluten Free</p>';
  }

  if (recipeObj.dairyFree) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #b3b3b3; margin: 5px; border: 2px solid #b3b3b3; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Dairy Free'><i class='fas fa-egg'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Dairy Free</p>';
  }

  if (recipeObj.veryHealthy) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #ff4d4d; margin: 5px; border: 2px solid #ff4d4d; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Very Healthy'><i class='fas fa-heartbeat'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Very Healthy</p>';
  }

  if (recipeObj.cheap) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #33cc33; margin: 5px; border: 2px solid #33cc33; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Cheap'><i class='fas fa-comment-dollar'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Cheap</p>';
  }

  if (recipeObj.sustainable) {
    dietMarkUp +=
      "<span class='shadow rounded-circle diet-icon d-inline-block text-center' style='padding: 5px; color: #804000; margin: 5px; border: 2px solid #804000; min-width: 38px;' data-toggle='tooltip' data-placement='top' title='Sustainable'><i class='fas fa-archive'></i></span>";

    recipeInfoData += '<p style="margin-bottom: 8px !important"><i class="fas fa-clipboard-check" style="color: #33cc33"></i> Sustainable</p>';
  }

  if (recipeInfoTab === false) {
    return dietMarkUp;
  } else {
    return recipeInfoData;
  }
}

function modifyDishType(arr) {
  const resultsArr = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].includes("main") === false) {
      const text = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
      resultsArr.push(text);
    }
  }

  if (resultsArr.length > 4) {
    resultsArr.splice(5);
  }

  const result = resultsArr.join(" / ");
  return result;
}

function removeRecipeIfExists(arr, recipe_id, recipe_title) {
  let index;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === recipe_id || arr[i].title === recipe_title) {
      index = i;
      break;
    }
  }

  if (isNaN(index) === false) {
    arr.splice(index, 1);
  } else {
    return;
  }
}

async function getRecipeInfo(recipe_id, clicked_btn, callingFrom) {
  if (callingFrom === "randomRecipesTab") {
    clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Loading...';
    clicked_btn.disabled = true;
  } else if (callingFrom === "historyTab") {
    $("#recipeInfo-tab").css("display", "none");
    $("#randomRecipes-tab").css("display", "none");
    $("#main-spinner").css("display", "flex");
  } else if (callingFrom === "searchTab") {
    $(`#spinner-search-result-${recipe_id}`).css("display", "inline-block");
    clicked_btn.disabled = true;
  } else if (callingFrom === "searchTabSimilar") {
    clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Loading...';
    clicked_btn.disabled = true;
  } else if (callingFrom === "searchTabHistory") {
    $("#recipe-search-main-container").css("display", "none");
    $("#recipeInfo-tab-searchTab").css("display", "none");
    $("#main-spinner-searchTab").css("display", "flex");
  } else if (callingFrom === "mealPlanTab") {
    clicked_btn.disabled = true;
    clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Loading...';
  } else if (callingFrom === "favouritesTab") {
    clicked_btn.disabled = true;
    clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span>Loading...';
  }

  try {
    const recipeCalls = await Promise.all([getRecipeObject(recipe_id), getRecipeEquipment(recipe_id), getRecipeNutritionWidget(recipe_id)]);

    console.log(recipeCalls);

    if (callingFrom === "randomRecipesTab") {
      const similarRecipesArr = await getSimilarRecipes(recipe_id);
      removeRecipeIfExists(similarRecipesArr, recipe_id, recipeCalls[0].title);
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "", similarRecipesArr);
      addRecipeToHistory(recipe_id, recipeCalls[0].title, "historyTab");
      clicked_btn.innerHTML = '<i class="fas fa-info-circle mr-1"></i>More info';
      clicked_btn.disabled = false;
      $("#randomRecipes-tab").css("display", "none");
      $("#recipeInfo-tab").css("display", "flex");
    } else if (callingFrom === "historyTab") {
      const similarRecipesArr = await getSimilarRecipes(recipe_id);
      removeRecipeIfExists(similarRecipesArr, recipe_id, recipeCalls[0].title);
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "", similarRecipesArr);
      addRecipeToHistory(recipe_id, recipeCalls[0].title, "historyTab");
      $("#main-spinner").css("display", "none");
      $("#randomRecipes-tab").css("display", "none");
      $("#recipeInfo-tab").css("display", "flex");
    } else if (callingFrom === "searchTab") {
      const similarRecipesArr = await getSimilarRecipes(recipe_id);
      $(`#spinner-search-result-${recipe_id}`).css("display", "none");
      clicked_btn.disabled = false;
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "-searchTab", similarRecipesArr);
      addRecipeToHistory(recipe_id, recipeCalls[0].title, "searchTabHistory");
      $("#recipe-search-main-container").css("display", "none");
      $("#recipeInfo-tab-searchTab").css("display", "flex");
    } else if (callingFrom === "searchTabSimilar") {
      const similarRecipesArr = await getSimilarRecipes(recipe_id);
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "-searchTab", similarRecipesArr);
      addRecipeToHistory(recipe_id, recipeCalls[0].title, "searchTabHistory");
      $("#recipe-search-main-container").css("display", "none");
      $("#recipeInfo-tab-searchTab").css("display", "flex");
      clicked_btn.disabled = false;
      clicked_btn.innerHTML = '<i class="fas fa-info-circle mr-1"></i>More info';
    } else if (callingFrom === "searchTabHistory") {
      const similarRecipesArr = await getSimilarRecipes(recipe_id);
      $("#main-spinner-searchTab").css("display", "none");
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "-searchTab", similarRecipesArr);
      addRecipeToHistory(recipe_id, recipeCalls[0].title, "searchTabHistory");
      $("#recipe-search-main-container").css("display", "none");
      $("#recipeInfo-tab-searchTab").css("display", "flex");
    } else if (callingFrom === "mealPlanTab") {
      clicked_btn.innerHTML = '<i class="fas fa-info-circle mr-2"></i>More info';
      clicked_btn.disabled = false;
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "-mealPlanTab");
      $("#mealPlan-main-container").css("display", "none");
      $("#recipeInfo-tab-mealPlanTab").css("display", "flex");
    } else if (callingFrom === "favouritesTab") {
      clicked_btn.innerHTML = '<i class="fas fa-info-circle mr-1"></i>More info';
      clicked_btn.disabled = false;
      createRecipeInfoHTML(recipeCalls[0], recipeCalls[1], recipeCalls[2], "-favouritesTab");
      $("#favouritesTab-main-container").css("display", "none");
      $("#recipeInfo-tab-favouritesTab").css("display", "flex");
    }
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
    if (callingFrom === "randomRecipesTab") {
      clicked_btn.innerHTML = '<i class="fas fa-info-circle mr-1"></i>More info';
    }
    if (callingFrom === "searchTab") {
      $(`#spinner-search-result-${recipe_id}`).css("display", "none");
    }
    clicked_btn.disabled = false;
  }
}

async function getSimilarRecipes(recipe_id) {
  const response = await fetch(`https://api.spoonacular.com/recipes/${recipe_id}/similar?number=6&apiKey=${apiKey}`);
  const responseParsed = await response.json();

  return responseParsed;
}

function goBackToRandomRecipes() {
  $("#randomRecipes-tab").css("display", "flex");
  $("#recipeInfo-tab").css("display", "none");
}

function createRecipeInfoHTML(recipeObj, recipeEquipment, nutritionWidget, searchTab = "", similarRecipesArr = false) {
  $("#recipeInfo--title" + searchTab).text(recipeObj.title);
  $("#recipeInfo--image" + searchTab).attr("src", recipeObj.image);

  let recipeInfoP = "";
  const dishTypes = modifyDishType(recipeObj.dishTypes);
  if (dishTypes.length > 0) {
    recipeInfoP += `<p><span style="font-weight: 600">Meal type:</span> ${dishTypes}</p>`;
  }
  recipeInfoP += `<p><span style="font-weight: 600">Cooking time:</span> ${recipeObj.readyInMinutes} minutes</p><p><span style="font-weight: 600">Number of servings:</span> ${
    recipeObj.servings
  }</p><p><span style="font-weight: 600">Price per serving:</span> ${modifyPriceNumber(recipeObj.pricePerServing)}$</p><p><span style="font-weight: 600">Spoonacular score:</span> ${
    recipeObj.spoonacularScore
  }%</p><p><span style="font-weight: 600">Health score:</span> ${recipeObj.healthScore}%</p>`;

  $("#recipeInfo--middleTab" + searchTab).html(recipeInfoP);
  $("#recipeInfo--dietTab" + searchTab).html(createDietIcons(recipeObj, true));
  createRecipeSummary(recipeObj, searchTab);

  createRecipeIngTab(recipeObj.extendedIngredients, recipeEquipment, searchTab);
  createNutritionTab(nutritionWidget, searchTab);
  createInstructionsTab(recipeObj.analyzedInstructions, searchTab);
  createWinePairingTab(recipeObj.winePairing, searchTab);
  if (similarRecipesArr) {
    if (similarRecipesArr.length > 0) {
      createSimilarRecipesTab(similarRecipesArr, searchTab);
      $(`#nav-similar-tab${searchTab}`).css("display", "block");
    } else {
      $(`#nav-similar-tab${searchTab}`).css("display", "none");
    }
  }

  document
    .querySelector("#nav-tab" + searchTab)
    .querySelectorAll(".nav-item")
    .forEach((element) => {
      if (element.classList.contains("active")) {
        element.classList.remove("active");
      }
    });

  document
    .querySelector("#nav-tabContent" + searchTab)
    .querySelectorAll(".tab-pane")
    .forEach((tab) => {
      if (tab.classList.contains("active") && tab.classList.contains("show")) {
        tab.classList.remove("active");
        tab.classList.remove("show");
      }
    });

  $("#nav-ingredients-tab" + searchTab).addClass("active");
  $("#nav-ingredients" + searchTab).addClass("active");
  $("#nav-ingredients" + searchTab).addClass("show");

  window.scrollTo(0, 0);
}

function modifyPriceNumber(number) {
  const result = number / 100;

  return result.toFixed(2);
}

async function getRecipeObject(recipe_id) {
  const response = await fetch(`https://api.spoonacular.com/recipes/${recipe_id}/information?includeNutrition=false&apiKey=${apiKey}`);
  const responseParsed = await response.json();

  return responseParsed;
}

async function getRecipeEquipment(recipe_id) {
  const response = await fetch(`https://api.spoonacular.com/recipes/${recipe_id}/equipmentWidget.json?apiKey=${apiKey}`);
  const responseParsed = await response.json();

  return responseParsed;
}

async function getRecipeNutritionWidget(recipe_id) {
  const response = await fetch(`https://api.spoonacular.com/recipes/${recipe_id}/nutritionWidget?apiKey=${apiKey}&defaultCss=true`, {
    headers: {
      Accept: "text/html",
    },
  });
  const responseParsed = await response.text();

  return responseParsed;
}

function createSimilarRecipesTab(recipesArr, tab) {
  let cardsMarkup = "";
  recipesArr.forEach((recipe) => {
    cardsMarkup += `<div class="col-lg-4 mb-3 mt-3"><div class="card shadow">
      <img src=" https://spoonacular.com/recipeImages/${recipe.id}-480x360.jpg" class="card-img-top" alt="${recipe.title}-image">
      <div class="card-body" style="padding: 10px !important">
        <h6 class="card-subtitle mb-2 text-muted text-center">${recipe.title}</h6>
        <button class="btn btn-warning btn-sm float-right" onclick="getRecipeInfo(${recipe.id}, this, '${tab === "" ? "randomRecipesTab" : "searchTabSimilar"}')"><i class="fas fa-info-circle mr-1"></i>More info</button>
      </div>
    </div></div>`;
  });

  $(`#nav-similar${tab}`).empty();
  $(`#nav-similar${tab}`).html(`<div class="row">${cardsMarkup}</div>`);
}

function createRecipeSummary(recipeObj, searchTab) {
  if (recipeObj.summary.length > 0) {
    const summaryArr = recipeObj.summary.split(". ");
    const finalArr = [];
    summaryArr.forEach((sentence) => {
      if (sentence.includes("href") === false) {
        finalArr.push(sentence);
      }
    });
    finalArr[finalArr.length - 1] += ".";

    const result = finalArr.join(". ");
    $("#recipe-summary" + searchTab).html(result);
  } else {
    $("#recipe-summary" + searchTab).html("Sorry, no description available for this recipe.");
  }

  let buttonsMarkUp = "";
  let historyBtn = "";
  if (searchTab !== "-mealPlanTab" && searchTab !== "-favouritesTab") {
    historyBtn = `<button class="btn btn-info" onclick="removeFromHistory(${recipeObj.id}, this, '${searchTab.length > 0 ? "searchTabHistory" : "historyTab"}')">Remove from history<i class="fas fa-trash ml-2"></i></button>`;
  }

  const checkLike = checkRecipeInFavourites(recipeObj.id);
  if (recipeObj.title.includes("'")) {
    recipeObj.title = recipeObj.title.split("'").join("");
  }

  if (checkLike) {
    buttonsMarkUp += `<p style="margin-bottom: 0px !important"><button class="btn btn-danger mr-4" disabled>Added to favourites<i class="fas fa-heart ml-2"></i></button>${historyBtn}</p>`;
  } else {
    const recipeObjModified = { id: recipeObj.id, title: recipeObj.title, image: recipeObj.image };
    buttonsMarkUp += `<p style="margin-bottom: 0px !important"><button id="btn-like-${recipeObj.id}" class="btn btn-danger mr-4" onclick='likeRecipe(${JSON.stringify(
      recipeObjModified
    )}, this)'>Add to favourites<i class="far fa-heart ml-2"></i></button>${historyBtn}</p>`;
  }

  $("#recipe-summary-buttons" + searchTab).empty();
  $("#recipe-summary-buttons" + searchTab).append(buttonsMarkUp);
}

function createRecipeIngTab(ingArr, recipeEquipment, searchTab) {
  let ingHTML = "";
  ingArr.forEach((ing) => {
    if (ing.id !== null) {
      const checkLS = checkItemInShoppingList(ing, "ingredients");
      ingHTML += `<div class='col-lg-2 mb-3' style="padding: 0px 10px !important"><p style='margin-bottom: 2px !important; font-size: 18px;' class="text-center">${ing.measures.us.amount} ${ing.measures.us.unitLong}</p><span class="popover-wrapper">
      <img data-role="popover" id="ingImg-${ing.id}" class="img-hover" onclick="closeSubstitutesList(${ing.id});" data-target="example-popover" width="100%" height="140px" src="https://spoonacular.com/cdn/ingredients_250x250/${
        ing.image
      }" style="object-fit: cover; background-color: #fff; border: ${checkLS === true ? "3px solid #70db70;" : "1px solid #dee2e6; padding: 2px;"} border-radius: .25rem;">
      <div class="popover-modal example-popover" ontoggle="myfunction()">
        <div class="popover-header">Ingredient options<a href="#" data-toggle-role="close" style="float: right;"><span aria-hidden="true" style="font-size: 20px">&times;</span></a>
        </div>
        <div class="popover-body">
          <p style="margin-bottom: 5px !important"><button data-item='${JSON.stringify({ id: ing.id, image: ing.image, name: ing.name })}' onclick='addToShoppingList("ingredients", this)' class="btn btn-success btn-block btn-sm" ${
        checkLS === true ? "disabled" : ""
      }>${checkLS === true ? "<i class='fas fa-check mr-1'></i>Added to the list" : '<i class="fas fa-list-ul mr-2"></i>Add to shopping list'}</button></p>
          <p style="margin-bottom: 0px !important"><button onclick="getSubstitutes(${ing.id}, this)" class="btn btn-info btn-block btn-sm"><i class="fas fa-sync-alt mr-2"></i>Ask for substitutes</button></p>
          <div id="sub-list-${ing.id}"></div>
        </div>
      </div>
    </span><p style='margin-bottom: 0px !important; font-size: 14px' class="text-center">${ing.name}</p></div>`;
    }
  });

  $("#ingredients-row" + searchTab).empty();
  $("#ingredients-row" + searchTab).append(ingHTML);
  $('[data-role="popover"]').popover();

  if (recipeEquipment.equipment) {
    if (recipeEquipment.equipment.length > 0) {
      let equipHTML = "";
      recipeEquipment.equipment.forEach((util) => {
        equipHTML += `<div class="col-lg-2"><img width="100%" alt="${util.name}-photo" height="100px" src="https://spoonacular.com/cdn/equipment_250x250/${util.image}" style="object-fit: cover; padding: 2px; background-color: #fff; border: 1px solid #dee2e6; border-radius: .25rem;"><p style='margin-bottom: 0px !important;' class="text-center">${util.name}</p></div>`;
      });

      $("#equipment-row" + searchTab).empty();
      $("#equipment-row" + searchTab).append(equipHTML);
      $("#equip-title" + searchTab).css("display", "block");
    } else {
      $("#equip-title" + searchTab).css("display", "none");
      $("#equipment-row" + searchTab).empty();
    }
  } else {
    $("#equip-title" + searchTab).css("display", "none");
    $("#equipment-row" + searchTab).empty();
  }
}

function createNutritionTab(widget, searchTab) {
  $("#nutrition-widget" + searchTab).empty();
  $("#nutrition-widget" + searchTab).html(widget);
  $(".spoonacular-nutrition-visualization-bar").attr("onmouseover", "");
  $(".spoonacular-nutrition-visualization-bar").attr("onmouseout", "");
}

function createInstructionsTab(instructionsArr, searchTab) {
  if (instructionsArr.length > 0) {
    let stepsList = "";
    instructionsArr.forEach((instruction) => {
      instruction.steps.forEach((step) => {
        let image;
        let imageName;
        if (step.ingredients.length > 0) {
          image = `https://spoonacular.com/cdn/ingredients_250x250/${step.ingredients[0].image}`;
          imageName = step.ingredients[0].name;
        } else if (step.equipment.length > 0) {
          image = `https://spoonacular.com/cdn/equipment_250x250/${step.equipment[0].image}`;
          imageName = step.equipment[0].name;
        }

        stepsList += `<button class="list-group-item list-group-item-action">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-2">STEP ${step.number}</h5>
          </div>
          <div class="row">
            ${
              image !== undefined
                ? '<div class="col-lg-2"><img width="100px" style="object-fit: cover; max-height: 80px !important" class="rounded" data-toggle="tooltip" data-placement="top" title="' +
                  imageName +
                  '" src="' +
                  image +
                  '"></div><div class="col-lg-10"><span style="margin-bottom: 10px !important; height: 100% !important" class="align-middle">' +
                  step.step +
                  "</span></div>"
                : '<div class="col-lg-12"><p style="margin-bottom: 0px !important;">' + step.step + "</p></div>"
            }
          </div>  
        </button>`;
      });
    });

    $("#instructions" + searchTab).empty();
    $("#instructions" + searchTab).append(stepsList);
    $('[data-toggle="tooltip"]').tooltip();
    $("#nav-instructions-tab" + searchTab).css("display", "block");
  } else {
    $("#nav-instructions-tab" + searchTab).css("display", "none");
  }
}

function createWinePairingTab(winePairingObj, searchTab) {
  if (winePairingObj.pairingText !== undefined && winePairingObj.pairingText.length > 0) {
    if (winePairingObj.pairedWines.length > 0) {
      winePairingObj.pairedWines.forEach((el, i) => {
        winePairingObj.pairedWines[i] = el.capitalize();
        return;
      });
      const lastArrItem = winePairingObj.pairedWines.splice(winePairingObj.pairedWines.length - 1, 1);
      $("#wine-types" + searchTab).text(`Recommended wine types: ${winePairingObj.pairedWines.join(", ")} and ${lastArrItem}`);
      $("#wine-types" + searchTab).css("display", "block");
    } else {
      $("#wine-types" + searchTab).css("display", "none");
    }

    $("#wine-text" + searchTab).text(winePairingObj.pairingText);

    if (winePairingObj.productMatches.length > 0) {
      const product = winePairingObj.productMatches[0];
      const checkLS = checkItemInShoppingList(product, "wines");
      if (checkLS === true) {
        $("#wineMatch-title" + searchTab).html(product.title + `<button class='btn btn-success btn-sm' style="position: absolute; right: 20px" disabled><i class='fas fa-check mr-1'></i>Added to the list</button>`);
      } else {
        $("#wineMatch-title" + searchTab).html(
          product.title +
            `<button class='btn btn-success btn-sm float-right' style="position: absolute; right: 20px" data-item='${JSON.stringify({
              id: product.id,
              title: product.title,
            })}' onclick='addToShoppingList("wines", this)'><i class="fas fa-list-ul mr-2"></i>Add to shopping list</button>`
        );
      }

      $("#wineMatch-image" + searchTab).attr("src", product.imageUrl);
      $("#wineMatch-rating" + searchTab).text(product.averageRating.toFixed(2));
      $("#wineMatch-ratingCount" + searchTab).text(product.ratingCount);
      $("#wineMatch-score" + searchTab).text(product.score.toFixed(2));
      $("#wineMatch-price" + searchTab).text(product.price);
      if (product.description !== null && product.description.length > 0) {
        $("#wineMatch-description" + searchTab).text(product.description);
        document.getElementById("wineMatch-description" + searchTab).parentElement.style.display = "block";
      } else {
        document.getElementById("wineMatch-description" + searchTab).parentElement.style.display = "none";
      }

      $("#productMatches-card" + searchTab).css("display", "block");
    } else {
      $("#productMatches-card" + searchTab).css("display", "none");
    }

    $("#nav-pairing-tab" + searchTab).css("display", "block");
  } else {
    $("#nav-pairing-tab" + searchTab).css("display", "none");
    return false;
  }
}

async function getSubstitutes(ing_id, clicked_btn) {
  clicked_btn.disabled = true;
  clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Searching...';
  $(`#sub-list-${ing_id}`).empty();

  try {
    const response = await fetch(`https://api.spoonacular.com/food/ingredients/${ing_id}/substitutes?apiKey=${apiKey}`);
    const responseParsed = await response.json();

    if (responseParsed.status === "success") {
      createSubstitutesList(responseParsed.substitutes, ing_id);
    } else {
      $(`#sub-list-${ing_id}`).append(`<p class="text-center" style="margin-bottom: 8px !important; margin-top: 8px !important; font-weight: 600;">No substitutes possible.</p>`);
    }

    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Ask for substitutes';
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Ask for substitutes';
  }
}

function createSubstitutesList(substitutesArr, ing_id) {
  $(`#sub-list-${ing_id}`).empty();
  $(`#sub-list-${ing_id}`).append(`<p class="text-center" style="margin-bottom: 8px !important; margin-top: 8px !important; font-weight: 600;">Found ${substitutesArr.length} substitutes.</p>`);

  let list = "";
  substitutesArr.forEach((item) => {
    list += `<li class="list-group-item" style="padding: 7px 12px !important">${item}</li>`;
  });

  $(`#sub-list-${ing_id}`).append(`<ul class="list-group">${list}</ul>`);
}

function closeSubstitutesList(ing_id) {
  $(`#sub-list-${ing_id}`).empty();
}

function addToShoppingList(type, clicked_btn) {
  const itemObj = JSON.parse(clicked_btn.dataset.item);
  const shoppingList = localStorage.getItem("shoppingList");
  if (shoppingList) {
    const shoppingListParsed = JSON.parse(shoppingList);
    if (shoppingListParsed[type]) {
      shoppingListParsed[type].push(itemObj);
      localStorage.setItem("shoppingList", JSON.stringify(shoppingListParsed));
    } else {
      shoppingListParsed[type] = [itemObj];
      localStorage.setItem("shoppingList", JSON.stringify(shoppingListParsed));
    }
  } else {
    const shoppingListObj = {};
    shoppingListObj[type] = [itemObj];
    localStorage.setItem("shoppingList", JSON.stringify(shoppingListObj));
  }

  clicked_btn.innerHTML = "<i class='fas fa-check mr-1'></i>Added to the list";
  clicked_btn.disabled = true;
  createShoppingListTab();

  if (type === "ingredients") {
    $(`#ingImg-${itemObj.id}`).css("border", "3px solid #70db70");
    $(`#ingImg-${itemObj.id}`).css("padding", "0px");
  }
}

function removeFromShoppingList(item_id, type) {
  const LSobject = JSON.parse(localStorage.getItem("shoppingList"));
  const index = LSobject[type].findIndex((el) => el.id === item_id);
  LSobject[type].splice(index, 1);

  localStorage.setItem("shoppingList", JSON.stringify(LSobject));
  createShoppingListTab();

  if (type === "wines") {
    $("#myModal").modal("hide");
  }
}

function checkItemInShoppingList(itemObj, type) {
  const shoppingList = localStorage.getItem("shoppingList");
  if (shoppingList) {
    const shoppingListParsed = JSON.parse(shoppingList);
    if (shoppingListParsed[type]) {
      const index = shoppingListParsed[type].findIndex((el) => el.id === itemObj.id);
      if (index !== -1) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function addRecipeToHistory(recipe_id, recipe_title, tab) {
  const history = localStorage.getItem("viewHistory");
  const object = { recipe_id, recipe_title };

  if (history) {
    const historyArr = JSON.parse(history);
    const index = historyArr.findIndex((el) => el.recipe_id === recipe_id);
    if (index === -1) {
      historyArr.push(object);
      localStorage.setItem("viewHistory", JSON.stringify(historyArr));
    }
  } else {
    const historyArr = [object];
    localStorage.setItem("viewHistory", JSON.stringify(historyArr));
  }

  createHistoryList(false, tab);
}

function removeFromHistory(recipe_id, clicked_btn, tab) {
  const historyArr = JSON.parse(localStorage.getItem("viewHistory"));
  const index = historyArr.findIndex((el) => el.recipe_id === recipe_id);
  historyArr.splice(index, 1);

  localStorage.setItem("viewHistory", JSON.stringify(historyArr));
  createHistoryList(false, tab);
  clicked_btn.parentNode.removeChild(clicked_btn);
}

function createHistoryList(onload = false, tab) {
  const historyArr = localStorage.getItem("viewHistory");
  if (historyArr) {
    const historyParsed = JSON.parse(historyArr);
    if (historyParsed.length > 0) {
      let listItems = "";
      historyParsed.forEach((el) => {
        listItems += `<li onclick="getRecipeInfo(${el.recipe_id}, false, '${tab}')" class="recipe-history-item">${el.recipe_title}</li>`;
      });

      $("#history-list").empty();
      $("#history-list").append(listItems);

      if (onload) {
        $("#history-card").show(600);
      } else {
        $("#history-card").css("display", "block");
      }
    } else {
      $("#history-card").css("display", "none");
    }
  } else {
    return;
  }
}

function likeRecipe(recipeObj, clicked_btn) {
  const favourites = localStorage.getItem("favouriteRecipes");

  if (favourites) {
    const favouritesArr = JSON.parse(favourites);
    favouritesArr.unshift(recipeObj);
    localStorage.setItem("favouriteRecipes", JSON.stringify(favouritesArr));
    $("#favRecipes-badge").text(favouritesArr.length);
  } else {
    const recipes = [recipeObj];
    localStorage.setItem("favouriteRecipes", JSON.stringify(recipes));
    $("#favRecipes-badge").text(recipes.length);
  }

  clicked_btn.innerHTML = "";
  clicked_btn.innerHTML = 'Added to favourites<i class="fas fa-heart ml-2"></i>';
  clicked_btn.disabled = true;
}

function removeFavouriteRecipe(recipe_id) {
  const favouriteRecipes = JSON.parse(localStorage.getItem("favouriteRecipes"));
  const index = favouriteRecipes.findIndex((el) => el.id === recipe_id);
  favouriteRecipes.splice(index, 1);

  localStorage.setItem("favouriteRecipes", JSON.stringify(favouriteRecipes));
  createFavouriteRecipesTab();
}

function checkRecipeInFavourites(recipe_id) {
  const favourites = localStorage.getItem("favouriteRecipes");

  if (favourites) {
    const favouritesArr = JSON.parse(favourites);
    const index = favouritesArr.findIndex((recipe) => recipe.id === recipe_id);

    if (index === -1) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

function checkItemInCheckbox(checkboxField, checkboxString, inputType) {
  const textInput = $(`#${inputType}-text-input`).val();

  if (textInput.length > 0) {
    if (checkboxField.checked) {
      $(`#${inputType}-text-input`).val(textInput + ", " + checkboxString);
      $("#clearFiltersBtn").css("visibility", "visible");
    } else {
      const valueArr = textInput.split(", ");
      const index = valueArr.findIndex((el) => el === checkboxString);
      valueArr.splice(index, 1);
      if (valueArr.length > 1) {
        $(`#${inputType}-text-input`).val(valueArr.join(", "));
      } else if (valueArr.length === 1) {
        $(`#${inputType}-text-input`).val(valueArr[0]);
      } else {
        $(`#${inputType}-text-input`).val("");
      }
    }
  } else {
    if (checkboxField.checked) {
      $(`#${inputType}-text-input`).val(checkboxString);
      $("#clearFiltersBtn").css("visibility", "visible");
    }
  }
}

async function autocompleteIngredientName(input, inputType) {
  if (input.length > 0) {
    try {
      const response = await fetch(`https://api.spoonacular.com/food/ingredients/autocomplete?query=${input}&number=5&apiKey=${apiKey}`);
      const responseParsed = await response.json();

      if (responseParsed.length > 0) {
        let resultsMarkup = "";
        $(`#${inputType}-ingredients-dropdown`).empty();
        responseParsed.forEach((ingredient) => {
          const nameArr = ingredient.name.split(" ").map((name) => name.capitalize());
          resultsMarkup += `<div class="dropdown-item" onclick="updateInputFieldAutocomplete('${nameArr.join(
            " "
          )}', '${inputType}');"><img width="50px" height="50px" style="object-fit: cover" class="rounded mr-3" src="https://spoonacular.com/cdn/ingredients_250x250/${ingredient.image}">${nameArr.join(" ")}</div>`;
        });

        $(`#${inputType}-ingredients-dropdown`).append(resultsMarkup);
        $(`#${inputType}-ingredients-dropdown`).css("display", "block");
      } else {
        $(`#${inputType}-ingredients-dropdown`).css("display", "none");
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Ooops!", "Server error! Please try again.", "error");
    }
  } else {
    $(`#${inputType}-ingredients-dropdown`).css("display", "none");
  }
}

function updateInputFieldAutocomplete(ingredientString, inputType) {
  const existingIngrediens = getIngredientValues(inputType);

  if (existingIngrediens.includes(ingredientString) === false) {
    const badgeMarkUp = `<span class="badge badge-${
      inputType === "include" ? "success" : "danger"
    } text-wrap mr-2 align-middle" style="font-size: 90%;">${ingredientString}<i class="fas fa-times-circle ml-1" style="font-size: 85%;" onclick="removeBadge(this.parentElement)"></i></span>`;

    $(`#${inputType}d-ingredients`).append(badgeMarkUp);
    $("#clearFiltersBtn").css("visibility", "visible");
  }

  $(`#${inputType}-ingredients-input`).val("");
  $(`#${inputType}-ingredients-dropdown`).css("display", "none");
}

function hideDropdown(inputType) {
  const inputValue = $(`#${inputType}-ingredients-input`).val();

  if (inputValue.length === 0) {
    $(`#${inputType}-ingredients-dropdown`).css("display", "none");
  }
}

function removeBadge(badge) {
  badge.parentNode.removeChild(badge);
}

function getIngredientValues(inputType) {
  const badgesArr = document.querySelector(`#${inputType}d-ingredients`).querySelectorAll(".badge");
  const results = [];
  badgesArr.forEach((el) => {
    results.push(el.innerText);
  });

  return results;
}

function selectNutrient(value) {
  const valueArr = value.split("-");
  const nutrientName = valueArr[0];

  let id;
  if (nutrientName.includes(" ")) {
    id = nutrientName.split(" ").join("-");
  } else {
    id = nutrientName;
  }

  const existingElement = document.getElementById(id + "-row");

  if (!existingElement) {
    const infoArr = valueArr[1].split(",");
    const minValue = infoArr[0].split(":")[1];
    const maxValue = infoArr[1].split(":")[1];
    const unit = infoArr[2].split(":")[1];

    const nutrientMarkUp = `<div onmouseover="displayTrashCan('${id}');" onmouseout="hideTrashCan('${id}');" class="row mb-1 nutrients-row" id="${id}-row" style="padding: 10px 0px !important; margin-right: 0px !important;">
    <div class="col-lg-3"><input class="form-control text-center" type="text" placeholder="${nutrientName}" style="font-weight: 600;" disabled></div>
    <div class="col-lg-4">
      <input type="range" class="custom-range mt-2" min="${minValue}" max="${maxValue}" step="1" oninput="updateRange(this.value, '${id}');" value="${minValue}" id="range-input-${id.replace("-", "")}">
    </div>
    <div class="col-lg-1" style="padding: 0px !important">
      <div style="display: inline-block; margin-top: 5px;"><span id="${id}-rangeSpan" class="mr-1">${minValue}</span>${unit}</div>
    </div>
    <div class="col-lg-4" style="padding-left: 10px !important; padding-top: 5px;">
      <div class="custom-control custom-radio custom-control-inline" style="margin: 0px !important">
        <input type="radio" id="${id.replace("-", "")}-radioBtnMin" class="custom-control-input" name="${id.replace("-", "")}-radioBtn" checked>
        <label class="custom-control-label" for="${id.replace("-", "")}-radioBtnMin">Min</label>
      </div>
      <div class="custom-control custom-radio custom-control-inline" style="margin: 0px !important">
        <input type="radio" id="${id.replace("-", "")}-radioBtnMax" class="custom-control-input" name="${id.replace("-", "")}-radioBtn">
        <label class="custom-control-label" for="${id.replace("-", "")}-radioBtnMax">Max</label>
      </div>
      <i class="fas fa-trash text-danger" style="margin-left: 35px; display: none;" id="${id}-trash" onclick="removeNutrientRow('${id}')"></i>
    </div>
  </div>`;

    $("#nutrients-table").append(nutrientMarkUp);
    $("#clearFiltersBtn").css("visibility", "visible");
  }

  $("#nutrition-filter").val("null");
}

function updateRange(value, nutrient_id) {
  $(`#${nutrient_id}-rangeSpan`).text(value);
}

function displayTrashCan(nutrient_id) {
  $(`#${nutrient_id}-trash`).css("display", "inline-block");
}

function hideTrashCan(nutrient_id) {
  $(`#${nutrient_id}-trash`).css("display", "none");
}

function removeNutrientRow(nutrient_id) {
  const nutritionFilters = document.getElementById("nutrients-table").querySelectorAll(".row");
  let test = 0;
  const searchFilterInputs = [];
  searchFilterInputs[0] = document.getElementById("diet-filter");
  searchFilterInputs[1] = document.getElementById("mealType-text-input");
  searchFilterInputs[2] = document.getElementById("intolerance-text-input");

  searchFilterInputs.forEach((input) => {
    if (input.value.length > 0 && input.value !== "null") {
      test++;
    }
  });

  if ($("#included-ingredients").html().length > 0 || $("#excluded-ingredients").html().length > 0) {
    test++;
  }

  if (nutritionFilters.length === 1 && test === 0) {
    $("#clearFiltersBtn").css("visibility", "hidden");
  }

  $(`#${nutrient_id}-row`).remove();
}

function createSearchQueryString() {
  let queryString = "";
  const mainSearchInput = $("#search-input-main").val();
  if (mainSearchInput) {
    queryString += `&query=${mainSearchInput}`;
  }

  const mealTypeFilter = $("#mealType-text-input").val();
  if (mealTypeFilter) {
    let mealTypeString;
    let mealTypeArr = mealTypeFilter.split(", ");
    if (mealTypeArr.length > 1) {
      mealTypeString = mealTypeArr.join(",").toLowerCase();
    } else {
      mealTypeString = mealTypeArr[0].toLowerCase();
    }

    queryString += `&type=${mealTypeString}`;
  }

  const dietFilter = $("#diet-filter").val();
  if (dietFilter !== "null") {
    queryString += `&diet=${dietFilter.toLowerCase()}`;
  }

  const intoleranceFilter = $("#intolerance-text-input").val();
  if (intoleranceFilter) {
    let intoleranceString;
    let intoleranceArr = intoleranceFilter.split(", ");
    if (intoleranceArr.length > 1) {
      intoleranceString = intoleranceArr.join(",").toLowerCase();
    } else {
      intoleranceString = intoleranceArr[0].toLowerCase();
    }

    queryString += `&intolerance=${intoleranceString}`;
  }

  const includedIngredientsArr = document.getElementById("included-ingredients").querySelectorAll(".badge");
  if (includedIngredientsArr.length > 0) {
    let includedIngString = "";
    includedIngredientsArr.forEach((el, i) => {
      if (i > 0) {
        includedIngString += `,${el.textContent.toLowerCase()}`;
      } else {
        includedIngString += `${el.textContent.toLowerCase()}`;
      }
    });

    queryString += `&includeIngredients=${includedIngString}`;
  }

  const excludedIngredientsArr = document.getElementById("excluded-ingredients").querySelectorAll(".badge");
  if (excludedIngredientsArr.length > 0) {
    let excludedIngString = "";
    excludedIngredientsArr.forEach((el, i) => {
      if (i > 0) {
        excludedIngString += `,${el.textContent.toLowerCase()}`;
      } else {
        excludedIngString += `${el.textContent.toLowerCase()}`;
      }
    });

    queryString += `&excludeIngredients=${excludedIngString}`;
  }

  const nutrientsTable = document.getElementById("nutrients-table").querySelectorAll(".custom-range");
  if (nutrientsTable) {
    nutrientsTable.forEach((el, i) => {
      const nutrient = el.id.split("-")[2];
      const value = el.value;
      let amount;
      if (document.getElementById(`${nutrient}-radioBtnMin`).checked) {
        amount = "min";
      } else {
        amount = "max";
      }

      queryString += `&${amount}${nutrient}=${value}`;
    });
  }

  return queryString;
}

async function performSearch(clicked_btn) {
  const queryString = createSearchQueryString();
  if (queryString.length === 0) {
    Swal.fire("Warning!", "No search parameters entered!", "error");
    return;
  }

  clicked_btn.disabled = true;
  clicked_btn.innerHTML = '<span class="spinner-border mr-2" role="status" style="width: 1.5rem; height: 1.5rem;"  aria-hidden="true"></span>Searching...';

  try {
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?apiKey=${apiKey}${queryString}&number=50`);
    const responseParsed = await response.json();

    if (responseParsed.results.length > 0) {
      $("#results-header").removeClass("text-center");
      $("#results-header").text(`Found ${responseParsed.results.length} results matching this criteria.`);
      if (responseParsed.results.length > 9) {
        paginate(1, responseParsed.results);
      } else {
        $("#results-table").empty();
        $("#pagination-container").hide();
        responseParsed.results.forEach((result) => createSearchResultsItem(result));
      }
    } else {
      $("#results-header").addClass("text-center");
      $("#results-header").text("Your criteria has no matches.");
      $("#results-table").empty();
      $("#pagination-container").hide();
    }

    $("#search-results-row").css("display", "flex");

    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-search mr-2"></i>Search</button>';
    $("#search-input-main").val("");
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-search mr-2"></i>Search</button>';
  }
}

function createSearchResultsItem(result) {
  const markUp = `<button type="button" class="list-group-item list-group-item-action search-results-hover" style="padding:10px 15px !important;" onclick="getRecipeInfo(${result.id}, this, 'searchTab');">
    <img src="${result.image}" width="80px" alt="" class="rounded mr-2">
    <span>${result.title}</span><div class="spinner-border text-info float-right mt-3" role="status" style="width: 1.5rem; height: 1.5rem; display: none;" id="spinner-search-result-${result.id}"></div>
  </button>`;

  $("#results-table").append(markUp);
}

function paginate(page, resultsArr) {
  if (resultsArr == false) {
    resultsArr = searchResultsGlobal;
  } else {
    searchResultsGlobal = resultsArr;
  }

  const num_of_pages = Math.ceil(resultsArr.length / 10);
  const start_position = (page - 1) * 10;
  const end_position = start_position + 10;

  $("#results-table").empty();
  for (let i = start_position; i < end_position; i++) {
    if (resultsArr[i]) {
      createSearchResultsItem(resultsArr[i]);
    } else {
      break;
    }
  }

  $("#pages-nav").empty();
  const previousPage = `<li class="page-item ${page === 1 ? "disabled" : ""}"><a class="page-link" href="#" onclick='paginate(${page - 1}, false)'>Previous</a></li>`;
  $("#pages-nav").append(previousPage);

  let allPages = "";
  for (let i = 1; i <= num_of_pages; i++) {
    allPages += `<li class="page-item ${i === page ? "active" : ""}"><a class="page-link" href="#" onclick='paginate(${i}, false)'>${i}</a></li>`;
  }
  $("#pages-nav").append(allPages);

  const nextPage = `<li class="page-item ${page === num_of_pages ? "disabled" : ""}"><a class="page-link" href="#" onclick='paginate(${page + 1}, false)'>Next</a></li>`;
  $("#pages-nav").append(nextPage);

  $("#pagination-container").css("display", "block");
}

function goBackToSearch() {
  $("#recipeInfo-tab-searchTab").css("display", "none");
  $("#recipe-search-main-container").css("display", "flex");
}

function clearAllFilters(clicked_btn) {
  $("#mealType-text-input").val("");
  $("#diet-filter").val("null");
  $("#intolerance-text-input").val("");
  $("#included-ingredients").empty();
  $("#excluded-ingredients").empty();
  $("#include-ingredients-input").val("");
  $("#exclude-ingredients-input").val("");
  $("#nutrients-table").empty();

  const checkboxes = document.querySelectorAll(".custom-checkbox");
  checkboxes.forEach((el) => {
    el.querySelector("input").checked = false;
  });

  clicked_btn.style.visibility = "hidden";
}

(function () {
  const searchFilterInputs = [];
  searchFilterInputs[0] = document.getElementById("diet-filter");
  searchFilterInputs[1] = document.getElementById("mealType-text-input");
  searchFilterInputs[2] = document.getElementById("intolerance-text-input");

  searchFilterInputs.forEach((input) => {
    input.addEventListener("change", function () {
      $("#clearFiltersBtn").css("visibility", "visible");
    });
  });
})();

function displaySearchTab() {
  $("#history-card").css("display", "none");
  $("#recipeInfo-tab-searchTab").css("display", "none");
  $("#recipe-search-main-container").css("display", "flex");
}

function displayRandomRecipesTab() {
  $("#recipeInfo-tab").css("display", "none");
  $("#randomRecipes-tab").css("display", "flex");
  createHistoryList(false, "historyTab");
}

async function generateMealPlan(clicked_btn) {
  clicked_btn.disabled = true;
  clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';

  try {
    const timeFrame = $("#time-frame").val();
    const queryString = createMealPlanQueryString();
    const response = await fetch(`https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}${queryString}`);
    const responseParsed = await response.json();

    if (timeFrame === "day") {
      createOneDayMealPlanHTML(responseParsed);
    } else {
      createWeekMealPlanHTML(responseParsed);
    }

    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit';
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit';
  }
}

function createMealPlanQueryString() {
  const timeFrame = $("#time-frame").val();
  let queryString = `&timeFrame=${timeFrame}`;

  const caloriesTarget = $("#calories-target").val();
  if (caloriesTarget) {
    queryString += `&targetCalories=${caloriesTarget}`;
  }

  const diet = $("#diet-mealPlan").val();
  if (diet !== "null") {
    queryString += `&diet=${diet}`;
  }

  const exclude = $("#exclude-mealPlan").val();
  if (exclude) {
    queryString += `&exclude=${exclude.replace(" ", "")}`;
  }

  return queryString;
}

function createWeekMealPlanHTML(dataObj, localStorage = false) {
  Object.keys(dataObj.week).forEach((day) => {
    let mealCards = "";
    const nutrientsObj = dataObj.week[day].nutrients;
    let nutritionData = `<div class="row mt-2">
      <div class="col-lg-12">
        <div class="alert alert-success" role="alert" style="margin-bottom: 0px !important; padding: 11px 20px !important;">
          <strong>Nutrients info: </strong> Calories - ${nutrientsObj.calories} cal, Carbohydrates - ${nutrientsObj.carbohydrates} g, Protein - ${nutrientsObj.protein} g, Fat - ${nutrientsObj.fat} g.
        </div>
      </div>
    </div>`;

    dataObj.week[day].meals.forEach((meal, i) => {
      let mealType;
      if (i === 0) {
        mealType = "Breakfast";
      } else if (i === 1) {
        mealType = "Lunch";
      } else {
        mealType = "Dinner";
      }

      let mealTitle;
      if (meal.title.length > 40) {
        mealTitle = meal.title.substring(0, 40);
        mealTitle += "...";
      } else {
        mealTitle = meal.title;
      }
      mealCards += `<div class="col-lg-4">
        <div class="card text-center shadow-sm" style="height: 260px !important">
          <img src="https://spoonacular.com/recipeImages/${meal.id}-312x150.jpg" class="card-img-top" alt="..." height="107px">
          <div class="card-body" style="padding: 10px !important;">
            <h5 class="card-title">${mealType}</h5>
            <p class="card-text">${mealTitle}</p>
            <p style="margin-bottom: 0px !important; position: absolute; bottom: 10px; right: 10px;"><button class="btn btn-sm btn-light btn-block" style="text-align: center;"  onclick="getRecipeInfo(${meal.id}, this, 'mealPlanTab');"><i class="fas fa-info-circle mr-2"></i>More info</button></p>
          </div>
        </div>
      </div>`;
    });

    $(`#list-${day}`).html(`<div class="row">${mealCards}</div>${nutritionData}`);
  });

  const navTabs = document.getElementById("list-tab").querySelectorAll(".list-group-item");
  navTabs.forEach((tab) => {
    if (tab.classList.contains("active")) {
      tab.classList.remove("active");
    }
  });

  const tabsContainers = document.getElementById("tab-content-containers").querySelectorAll(".tab-pane");
  tabsContainers.forEach((container) => {
    if (container.classList.contains("show") && container.classList.contains("active")) {
      container.classList.remove("show");
      container.classList.remove("active");
    }
  });

  if (localStorage) {
    document.getElementById("saveMealPlanWeekly--btn").disabled = true;
    document.getElementById("saveMealPlanWeekly--btn").innerHTML = '<i class="fas fa-check-circle mr-1"></i> Saved';
  } else {
    document.getElementById("saveMealPlanWeekly--btn").disabled = false;
    document.getElementById("saveMealPlanWeekly--btn").innerHTML = '<i class="fas fa-cloud-download-alt mr-2"></i> Save';
  }

  $("#list-monday-list").addClass("active");
  $("#list-monday").addClass("show");
  $("#list-monday").addClass("active");

  $("#oneDay-mealPlan").hide();
  $("#entireWeek-mealPlan").show();

  document.getElementById("saveMealPlanWeekly--btn").dataset.mealPlan = `${JSON.stringify(dataObj)}`;
}

function createOneDayMealPlanHTML(dataObj, localStorage = false) {
  let mealCards = "";
  const nutrientsObj = dataObj.nutrients;
  let nutritionDataAlert = `<strong>Nutrients info: </strong> Calories - ${nutrientsObj.calories} cal, Carbohydrates - ${nutrientsObj.carbohydrates} g, Protein - ${nutrientsObj.protein} g, Fat - ${nutrientsObj.fat} g.`;

  dataObj.meals.forEach((meal, i) => {
    let mealType;
    if (i === 0) {
      mealType = "Breakfast";
    } else if (i === 1) {
      mealType = "Lunch";
    } else {
      mealType = "Dinner";
    }

    let mealTitle;
    if (meal.title.length > 43) {
      mealTitle = meal.title.substring(0, 43);
      mealTitle += "...";
    } else {
      mealTitle = meal.title;
    }
    mealCards += `<div class="col-lg-4">
      <div class="card text-center shadow-sm" style="height: 360px !important">
        <img src="https://spoonacular.com/recipeImages/${meal.id}-480x360.jpg" class="card-img-top" alt="...">
        <div class="card-body" style="padding: 10px !important;">
          <h5 class="card-title">${mealType}</h5>
          <p class="card-text">${mealTitle}</p>
          <p style="margin-bottom: 0px !important; position: absolute; bottom: 10px; right: 10px;"><button class="btn btn-sm btn-light btn-block" style="text-align: center;"  onclick="getRecipeInfo(${meal.id}, this, 'mealPlanTab');"}><i class="fas fa-info-circle mr-2"></i>More info</button></p>
        </div>
      </div>
    </div>`;
  });

  if (localStorage) {
    document.getElementById("saveMealPlanDaily--btn").disabled = true;
    document.getElementById("saveMealPlanDaily--btn").innerHTML = '<i class="fas fa-check-circle mr-1"></i> Saved';
  } else {
    document.getElementById("saveMealPlanDaily--btn").disabled = false;
    document.getElementById("saveMealPlanDaily--btn").innerHTML = '<i class="fas fa-cloud-download-alt mr-2"></i> Save';
  }

  $("#oneDay-mealPlan-row").empty();
  $("#oneDay-mealPlan-row").append(mealCards);
  $("#oneDay-nutritionInfo").html(nutritionDataAlert);
  $("#entireWeek-mealPlan").hide();
  $("#oneDay-mealPlan").show();

  document.getElementById("saveMealPlanDaily--btn").dataset.mealPlan = `${JSON.stringify(dataObj)}`;
}

function goBackToMealPlan() {
  $("#recipeInfo-tab-mealPlanTab").css("display", "none");
  $("#mealPlan-main-container").css("display", "flex");
  $("#history-card").css("display", "none");
  checkMealPlanInLS();
}

function saveMealPlan(clicked_btn) {
  const dataJSON = clicked_btn.dataset.mealPlan;
  localStorage.setItem("mealPlan", dataJSON);

  clicked_btn.disabled = true;
  clicked_btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Saved';
}

function checkMealPlanInLS() {
  const mealPlan = localStorage.getItem("mealPlan");
  if (mealPlan) {
    const mealPlanObj = JSON.parse(mealPlan);
    if (mealPlanObj.week) {
      createWeekMealPlanHTML(mealPlanObj, true);
    } else {
      createOneDayMealPlanHTML(mealPlanObj, true);
    }
  } else {
    return false;
  }
}

function displayChatbotTab() {
  if (chatbotDisplayed === false) {
    customizeChatbot();
  } else {
    welcomeBackTypeWriter();
  }
  $("#history-card").css("display", "none");
  chatbotDisplayed = true;
}

function customizeChatbot() {
  const genderArr = ["male", "female"];
  const randomNumber = Math.round(Math.random());
  const gender = genderArr[randomNumber];

  const welcomeText = `Hello there! My name is ${
    gender === "male" ? "Bryan" : "Jessica"
  }. I am kind of bored and would appreciate if you have a few minutes to chat with me. You can say or ask me anything and l will let you know if l have any suggestions :)`;

  $("#chatbot-img").attr("src", `./avatars/${gender}.png`);
  $("#chatbot-name").text(`${gender === "male" ? "Bryan" : "Jessica"}`);

  let i = 0;
  const speed = 30;

  function typeWriter() {
    if (i < welcomeText.length) {
      if (i === 12) {
        document.getElementById("welcome-text").innerHTML += '<i class="fas fa-hand-paper ml-2" style="font-size: 25px; color: #ffd480;" id="animation-hand"></i><br>';
        document.getElementById("animation-hand").style.animation = "shake 0.1s";
        document.getElementById("animation-hand").style.animationIterationCount = "infinite";
        setTimeout(typeWriter, 700);
      } else {
        document.getElementById("welcome-text").innerHTML += welcomeText.charAt(i);
        if (document.getElementById("animation-hand")) {
          document.getElementById("animation-hand").style.animation = "none";
        }
        setTimeout(typeWriter, speed);
      }

      i++;
    } else {
      $("#conversation-suggestions-col").show(600);
    }
  }

  typeWriter();
}

async function getConversationSuggestions(query) {
  if (query.length > 0 && query !== " ") {
    document.getElementById("ask--btn").disabled = false;
    document.getElementById("empty-field--btn").disabled = false;
    try {
      const response = await fetch(`https://api.spoonacular.com/food/converse/suggest?query=${query}&number=5&apiKey=${apiKey}`);
      const responseParsed = await response.json();

      if (responseParsed.suggests._.length > 0) {
        $("#suggestions-list").empty();
        responseParsed.suggests._.forEach((suggestion) => {
          const markUp = `<a href="#" style="padding: 5px 15px !important;" class="list-group-item list-group-item-action" onclick="appendQuestionToInput(this)">${suggestion.name}</a>`;
          $("#suggestions-list").append(markUp);
        });

        $("#suggestions-dropdown").css("display", "block");
      } else {
        $("#suggestions-dropdown").css("display", "none");
      }
    } catch (err) {
      console.log(err);
      Swal.fire("Ooops!", "Server error! Please try again.", "error");
    }
  } else {
    document.getElementById("ask--btn").disabled = true;
    document.getElementById("empty-field--btn").disabled = true;
    $("#suggestions-dropdown").css("display", "none");
  }
}

function hideSuggestionsDropdown(value) {
  if (value.length === 0 || value === " ") {
    $("#suggestions-dropdown").css("display", "none");
  }
}

async function talkToChatbot() {
  document.getElementById("ask--btn").disabled = true;
  document.getElementById("ask--btn").innerHTML = "Thinking...";
  document.getElementById("empty-field--btn").disabled = true;
  try {
    const question = $("#conversation-subject").val();
    const response = await fetch(`https://api.spoonacular.com/food/converse?text=${question.replace(/ /g, "+")}&apiKey=${apiKey}`);
    const responseParsed = await response.json();

    const chatbotName = $("#chatbot-name").text();
    const answerMarkup = `<div class="alert alert-warning alert-dismissible fade show" role="alert">
      <p style="margin-bottom: 5px !important"><strong>Me:</strong> ${question}</p>
      <p style="margin-bottom: 0px !important"><strong>${chatbotName}:</strong> ${responseParsed.answerText}</p>
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>`;

    $("#answers-list").prepend(answerMarkup);
    document.getElementById("ask--btn").disabled = false;
    document.getElementById("ask--btn").innerHTML = "Ask question";
    document.getElementById("empty-field--btn").disabled = false;
    emptyQuestionInput();
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
    document.getElementById("ask--btn").disabled = false;
    document.getElementById("ask--btn").innerHTML = "Ask question";
    document.getElementById("empty-field--btn").disabled = false;
  }
}

function appendQuestionToInput(clicked_element) {
  const text = clicked_element.innerText;
  $("#conversation-subject").val(text);
  $("#suggestions-dropdown").css("display", "none");
}

function emptyQuestionInput() {
  $("#conversation-subject").val("");
  document.getElementById("ask--btn").disabled = true;
  document.getElementById("empty-field--btn").disabled = true;
}

function welcomeBackTypeWriter() {
  let i = 0;
  const speed = 50;
  const text = "Nice to see you again! :)";
  $("#welcome-back-text").text("");

  function typeWriter() {
    if (i < text.length) {
      document.getElementById("welcome-back-text").innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, speed);
    }
  }

  typeWriter();
}

function changeWineFilters(input_value) {
  const allInputs = document.querySelectorAll(".wine-inputs");
  allInputs.forEach((input) => (input.style.display = "none"));
  $(`#${input_value}-inputTab`).show(700);
}

function enableBtn(btn_id, input_value) {
  if (input_value.length > 0 && input_value !== " ") {
    document.getElementById(btn_id).disabled = false;
  } else {
    document.getElementById(btn_id).disabled = true;
  }
}

async function getWinesHandler(type, clicked_btn) {
  clicked_btn.disabled = true;
  clicked_btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Searching...';
  let query;
  let resultHandlerFunction;
  let wine;

  if (type === "dish-pairing") {
    wine = $(`#${type}-input`).val();
    query = `dishes?wine=${wine}`;
    resultHandlerFunction = createDishPairingAlert;
  } else if (type === "wine-pairing") {
    wine = $(`#${type}-input`).val();
    const maxPrice = $(`#${type}-input-maxPrice`).val();
    query = `pairing?food=${wine}${maxPrice !== null ? "&maxPrice=" + maxPrice : ""}`;
    resultHandlerFunction = createWinePairingAlert;
  } else if (type === "wine-description") {
    wine = $(`#${type}-input`).val();
    query = `description?wine=${wine}`;
    resultHandlerFunction = createWineDescriptionAlert;
  } else {
    wine = $(`#${type}-input`).val();
    const maxPrice = $(`#${type}-input-maxPrice`).val();
    const minRating = $(`#${type}-input-minRating`).val();
    query = `recommendation?wine=${wine}&number=6${maxPrice !== null ? "&maxPrice=" + maxPrice : ""}${minRating !== null ? "&minRating=" + minRating : ""}`;
    resultHandlerFunction = createWineRecommendationAlert;
  }

  try {
    const response = await fetch(`https://api.spoonacular.com/food/wine/${query}&apiKey=${apiKey}`);
    const responseParsed = await response.json();
    if (responseParsed.status === "failure") {
      resultHandlerFunction({ text: "", wineDescription: "", pairingText: "", recommendedWines: [] }, wine);
    } else {
      resultHandlerFunction(responseParsed, wine);
    }

    $(`#${type}-input`).val("");
    clicked_btn.disabled = true;
    clicked_btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit';
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
    clicked_btn.disabled = false;
    clicked_btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Submit';
  }
}

function createDishPairingAlert(response, wine) {
  const text = response.text;
  const alertMarkup = `<div class="alert shadow-sm alert-danger alert-dismissible fade show" style="padding: 20px" role="alert">
    <h5>Dish pairing for '${wine}'</h5>
    <p>${text.length > 0 ? text : "Sorry, there are no results matching this criteria."}</p>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

  $("#wine-results-row").prepend(alertMarkup);
}

function createWinePairingAlert(response, food) {
  let productMarkup = "";
  if (response.productMatches) {
    const product = response.productMatches[0];
    if (product) {
      const checkLS = checkItemInShoppingList(product, "wines");
      let description = product.description;
      if (description.length > 490) {
        description = product.description.substring(0, 490);
        description += "...";
      }
      productMarkup = `<div class="card shadow-sm mt-3" style="max-width: 100%; max-height: 395px !important; color: #4d4d4d !important;">
      <div class="row no-gutters">
        <div class="col-md-3">
          <img src="${product.imageUrl}" class="card-img" alt="${product.title}" style="object-fit: cover; max-height: 393px !important">
        </div>
        <div class="col-md-9">
          <div class="card-body" style="padding: 10px !important">
            <h5 class="card-title">${product.title}</h5>
            <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Average rating: </span>${product.averageRating.toFixed(2)} (${product.ratingCount} ratings)</p>
            <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Score: </span>${product.score.toFixed(2)}</p>
            ${description !== null ? '<p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Description: </span>' + description + "</p>" : ""}
            <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Price: </span>${product.price}</p>
            <button data-item='${JSON.stringify({
              id: product.id,
              title: product.title,
              imageUrl: product.imageUrl,
            })}' onclick='addToShoppingList("wines", this)' class="btn btn-success btn-sm mb-3" style="position: absolute; right: 10px; bottom: 0px; margin-top: 10px" ${checkLS === true ? "disabled" : ""}>${
        checkLS === false ? '<i class="fas fa-list-ul mr-2"></i>Add to shopping list' : '<i class="fas fa-check mr-1"></i>Added to the list'
      }</button>
          </div>
        </div>
      </div>
    </div>`;
    }
  }

  const text = response.pairingText;
  const alertMarkup = `<div class="alert alert-danger alert-dismissible fade show shadow-sm" style="padding: 20px" role="alert">
    <h5>Wine pairing for '${food}'</h5>
    <p>${text.length > 0 ? text : "Sorry, there are no results matching this criteria."}</p>
    ${productMarkup}
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

  $("#wine-results-row").prepend(alertMarkup);
  $(`#wine-pairing-input-maxPrice`).val("");
}

function createWineDescriptionAlert(response, wine) {
  const text = response.wineDescription;
  const alertMarkup = `<div class="alert alert-danger alert-dismissible fade show shadow-sm" style="padding: 20px" role="alert">
    <h5>Description for '${wine}'</h5>
    <p>${text.length > 0 ? text : "Sorry, there are no results matching this criteria."}</p>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

  $("#wine-results-row").prepend(alertMarkup);
}

function createWineRecommendationAlert(response, wine) {
  let cardsMarkup = "";
  if (response.recommendedWines.length > 0) {
    response.recommendedWines.forEach((product) => {
      let description;
      if (product.description !== null) {
        description = product.description;
      } else {
        description = "There is no description for this product.";
      }

      const checkLS = checkItemInShoppingList(product, "wines");
      cardsMarkup += `<div class="col-lg-6"><div class="card shadow-sm mt-3" data-toggle="tooltip" data-placement="right" title="${description}" style="height: 230px !important; color: #4d4d4d !important; font-size: 14px;">
        <div class="row no-gutters">
          <div class="col-md-4">
            <img src="${product.imageUrl}" class="card-img" alt="${product.title}" style="object-fit: cover; height: 228px !important">
          </div>
          <div class="col-md-8">
            <div class="card-body" style="padding: 10px !important">
              <h5 class="card-title">${product.title}</h5>
              <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Average rating: </span>${product.averageRating.toFixed(2)}</p>
              <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Rating count: </span>${product.ratingCount} ratings</p>
              <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Score: </span>${product.score.toFixed(2)}</p>
              <p class="card-text" style="margin-bottom: 3px !important"><span style="font-weight: 500">Price: </span>${product.price}</p>
              <button data-item='${JSON.stringify({
                id: product.id,
                title: product.title,
                imageUrl: product.imageUrl,
              })}' onclick='addToShoppingList("wines", this)' class="btn btn-success btn-sm mb-3" style="position: absolute; right: 10px; bottom: 0px; margin-top: 10px" ${checkLS === true ? "disabled" : ""}>${
        checkLS === false ? '<i class="fas fa-list-ul mr-2"></i>Add to shopping list' : '<i class="fas fa-check mr-1"></i>Added to the list'
      }</button>
            </div>
          </div>
        </div>
      </div></div>`;
    });
  } else {
    cardsMarkup = "<p style='margin-left: 15px;'>Sorry, there are no results matching this criteria.</p>";
  }

  const alertMarkup = `<div class="alert alert-danger alert-dismissible fade show shadow-sm" style="padding: 20px" role="alert">
    <h5>Wine recommendations for '${wine}'</h5>
    <div class="row">${cardsMarkup}</div>
    <button type="button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span>
    </button>
  </div>`;

  $("#wine-results-row").prepend(alertMarkup);
  $(`#wine-recommendation-input-maxPrice`).val("");
  $(`#wine-recommendation-input-minRating`).val("");
  $('[data-toggle="tooltip"]').tooltip();
}

function displayWinesTab() {
  $("#history-card").css("display", "none");
}

function goBackToFavourites() {
  $("#recipeInfo-tab-favouritesTab").css("display", "none");
  $("#favouritesTab-main-container").css("display", "flex");
}

async function getWineDetailsModal(wine_id) {
  $("#main-row-modal").css("display", "none");
  $("#spinner-modal").css("display", "flex");

  try {
    const response = await fetch(`https://api.spoonacular.com/food/products/${wine_id}?apiKey=${apiKey}`);
    const responseParsed = await response.json();

    const price = (responseParsed.price / 100).toFixed(2);
    $("#wine-img-modal").attr("src", responseParsed.images[1]);
    $("#wine-title-modal").text(responseParsed.title);
    $("#wine-description-modal").text(responseParsed.description);
    $("#wine-price-modal").text(price);
    $("#remove-btn-modal").attr("onclick", `removeFromShoppingList(${wine_id}, "wines")`);

    $("#spinner-modal").css("display", "none");
    $("#main-row-modal").css("display", "flex");
  } catch (err) {
    console.log(err);
    Swal.fire("Ooops!", "Server error! Please try again.", "error");
  }
}
