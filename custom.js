var apiUrl = 'https://qa.okroger.ai/';
var urlAuth = apiUrl + 'traveler/authorize?redirect_uri=' + window.location.href.split('?')[0];

$(function () {
    var $form = $('#payment-form');
    $form.submit(function (event) {
        Stripe.card.createToken($form, stripeResponseHandler);
        return false;
    });
});

function getParameterByName(key) {
    return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

function stripeResponseHandler(status, response) {
    var $form = $('#payment-form');
    if (response.error) {
        $form.find('.payment-errors').text(response.error.message);
        $form.find('.payment-errors').css("display", "block");
    } else {
        var token = response.id;
        addCard(token);
    }
}

$(function () {
    $(".lws").attr("href", urlAuth);

    var travelerId = getParameterByName('travelerId');
    var authToken = getParameterByName('authToken');

    if (travelerId != '' && authToken != '') {
        localStorage.setItem('travelerId', travelerId);
        localStorage.setItem('authToken', authToken);
        window.location.href = window.location.href.split('?')[0];
        return false;
    }
    var travelerIdLocal = localStorage.getItem('travelerId');
    var authTokenLocal = localStorage.getItem('authToken');
    if (travelerIdLocal === null && authTokenLocal === null) {
        $(".beforelogin").css("display", "block");
        $(".afterlogin").css("display", "none");

    } else {
        // Get Traveler Profile info
        getTraveler(travelerIdLocal, authTokenLocal);
        // Get Traveler Cards
        getTravelerCards(travelerIdLocal, authTokenLocal);

        $(".beforelogin").css("display", "none");
        $(".afterlogin").css("display", "block");
    }

});

function travelerLogout() {
    console.log("User logged out");
    localStorage.removeItem('travelerId');
    localStorage.removeItem('authToken');
    window.location.href = 'https://www.okroger.ai/travelers';
}

function getTraveler(travelerId, authToken) {
    $.ajax({
        type: 'GET',
        url: apiUrl + 'traveler/' + travelerId,
        headers: {'Authorization': "Bearer " + authToken},
        crossDomain: true,
        success: function (data) {
            $(".travelerInfo").text(data.firstName + ' ' + data.lastName);
            $(".clientInfo").text(data.client);
            $(".travelerEmail").html("<a href='mailto:" + data.email + "'>" + data.email + "</a>");
        },
        error: function (err) {
            displayError(err);
        }
    });

}

function getTravelerCards(travelerId, authToken) {
    $.ajax({
        type: 'GET',
        url: apiUrl + 'traveler/' + travelerId + '/cards',
        headers: {'Authorization': "Bearer " + authToken},
        crossDomain: true,
        success: function (data) {
            var cards = $(".travelercards");
            cards.html("");
            var len = data.length;
            if (len > 0) {
                for (i = 0; i < len; i++) {
                    var defalt = 'star-empty';
                    if (data[i].default == true) {
                        defalt = 'star';
                    }
                    var cardDefault = '<span class="glyphicon glyphicon-' + defalt + '" aria-hidden="true"></span>';
                    var html = '<tr><td>' + data[i].type + '</td><td>' + data[i].expiryMonth + '</td><td>' + data[i].expiryYear + '</td><td>' + data[i].last4 + '</td><td>' + data[i].brand + '</td><td>' + data[i].country + '</td><td>' + cardDefault + '</td><td><a href="javascript:void(0)" onclick=removeCard("' + data[i].id + '") ><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a></td></tr>';
                    cards.append(html);
                }
            } else {
                cards.append('<tr><td colspan="8">Add your first card</td></tr>');
            }
        },
        error: function (err) {
            displayError(err);
        }
    });

}

function removeCard(cardId) {
    var travelerId = localStorage.getItem('travelerId');
    var authToken = localStorage.getItem('authToken');
    $.ajax({
        type: 'DELETE',
        url: apiUrl + 'traveler/' + travelerId + '/card/' + cardId,
        headers: {'Authorization': "Bearer " + authToken},
        crossDomain: true,
        success: function (data) {
            getTravelerCards(travelerId, authToken);
        },
        error: function (err) {
            displayError(err);
        }
    });

}

function addCard(token) {
    var travelerId = localStorage.getItem('travelerId');
    var authToken = localStorage.getItem('authToken');
    $.ajax({
        type: 'POST',
        url: apiUrl + 'traveler/' + travelerId + '/card',
        headers: {'Authorization': "Bearer " + authToken},
        data: JSON.stringify({"stripeToken": token}),
        contentType: 'application/json; charset=utf-8',
        crossDomain: true,
        success: function (data) {
            getTravelerCards(travelerId, authToken);
            $('#myModal').modal('toggle');
        },
        error: function (err) {
            $('#myModal').modal('toggle');
            displayError(err);
        }
    });
}

function displayError(err) {
    var message = '';
    if (err.status != 500)
        message = JSON.parse(err.responseText).message;
    else
        message = err.responseText;
    $('#api-errors').text(message).css("display", "block");
}

