// Source: https://github.com/dwyl/learn-to-send-email-via-google-script-html-no-server/blob/ee8597094e000236532c8c909cec2add8fac2d4f/form-submission-handler.js
(function () {
  function isBotSubmission(form) {
    var elements = form.elements;

    return Object.keys(form.elements).some(function (element, k) {
      return elements[k].name === "honeypot" && !!elements[k].value // If the honeypot field is filed, this might be a robot
    });
  }

  // get all data in form and return object
  function getFormData(form) {
    var elements = form.elements;

    var fields = Object.keys(elements).filter(function (k) {
      return (elements[k].name !== "honeypot");
    }).map(function (k) {
      if (elements[k].name !== undefined) {
        return elements[k].name;
        // special case for Edge's html collection
      } else if (elements[k].length > 0) {
        return elements[k].item(0).name;
      }
    }).filter(function (item, pos, self) {
      return self.indexOf(item) === pos && item;
    });

    var formData = {};
    fields.forEach(function (name) {
      var element = elements[name];

      // singular form elements just have one value
      formData[name] = element.value;

      // when our element has multiple items, get their values
      if (element.length) {
        var data = [];
        for (var i = 0; i < element.length; i++) {
          var item = element.item(i);
          if (item.checked || item.selected) {
            data.push(item.value);
          }
        }
        formData[name] = data.join(', ');
      }
    });

    // add form-specific values into the data
    formData.formDataNameOrder = JSON.stringify(fields);
    formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name

    console.log(formData);
    return formData;
  }

  function handleFormSubmit(event) {  // handles form submit without any jquery
    event.preventDefault();           // we are submitting via xhr below
    var form = event.target;

    // Enable SPAM prevention, see https://github.com/dwyl/learn-to-send-email-via-google-script-html-no-server#spam-prevention
    if (isBotSubmission(form)) {  // if bot is detected, form will not be submitted
      return false;
    }
    var data = getFormData(form);         // get the values submitted in the form

    disableAllButtons(form);
    var url = form.action;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      console.log(xhr.status, xhr.statusText);
      console.log(xhr.responseText);
      var formElements = form.querySelector("#form-elements");
      if (formElements) {
        formElements.style.display = "none"; // hide form
      }
      var thankYouMessage = form.querySelector("#thank-you-message");
      if (thankYouMessage) {
        thankYouMessage.style.display = "block";
      }
      return;
    };

    // url encode form data for sending as post data
    var encoded = Object.keys(data).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    }).join('&');
    xhr.send(encoded);
  }

  // }

  function loaded() {
    // bind to the submit event of our form
    var forms = document.querySelectorAll("form#gform");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleFormSubmit, false);
      console.log("Contact form submission handler loaded successfully.");
    }
  };
  document.addEventListener("DOMContentLoaded", loaded, false);

  function disableAllButtons(form) {
    var buttons = form.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }
})();
