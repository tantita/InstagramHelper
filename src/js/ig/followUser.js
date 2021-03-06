/* globals alert, $, instaDefOptions, instaMessages, instaTimeout, instaCountdown */

var followUser = function () { };

followUser.follow = function (settings) {

  'use strict';

  var {
    username, userId, csrfToken, updateStatusDiv
  } = settings;

  return new Promise(function (resolve, reject) {
    follow(userId, csrfToken, resolve, reject);
  });

  function successFollow(data, resolve) {
    updateStatusDiv(`The request to follow ${username} was successful with response - ${data.result}`);
    resolve(data.result);
  }

  function retryError(message, errorNumber, resolve, reject) {
    updateStatusDiv(message, 'red');
    instaTimeout.setTimeout(3000)
      .then(function () {
        return instaCountdown.doCountdown('status', errorNumber, 'Following', +(new Date()).getTime() + instaDefOptions.retryInterval);
      })
      .then(() => {
        console.log('Continue execution after HTTP error', errorNumber, new Date()); //eslint-disable-line no-console
        follow(userId, csrfToken, resolve, reject);
      });

  }

  function errorFollow(jqXHR, resolve, reject) {
    console.log(`Error making ajax request to follow ${username}, status - ${jqXHR.status}`); //eslint-disable-line no-console
    console.log(arguments); //eslint-disable-line no-console
    var message;
    if (jqXHR.status === 0) {
      console.log('Not connected.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('NOTCONNECTED', null, +instaDefOptions.retryInterval / 60000);
      retryError(message, jqXHR.status, resolve, reject);
    } else if (jqXHR.status === 403) {
      console.log('HTTP403 error trying to follow user.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP403', null, +instaDefOptions.retryInterval / 60000);
      retryError(message, jqXHR.status, resolve, reject);
    } else if (jqXHR.status === 429) {
      console.log('HTTP429 error trying to follow user.', new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP429', null, +instaDefOptions.retryInterval / 60000);
      retryError(message, jqXHR.status, resolve, reject);
    } else if ((jqXHR.status === 500) || (jqXHR.status === 502) || (jqXHR.status === 503) || (jqXHR.status === 504)) {
      console.log('HTTP50X error trying to follow user - ' + jqXHR.status, new Date()); //eslint-disable-line no-console
      message = instaMessages.getMessage('HTTP50X', jqXHR.status, +instaDefOptions.retryInterval / 60000);
      retryError(message, jqXHR.status, resolve, reject);
    } else {
      alert(instaMessages.getMessage('ERRFOLLOWUSER', username, jqXHR.status));
      reject();
    }
  }

  function follow(userId, csrfToken, resolve, reject) {
    var link = `https://www.instagram.com/web/friendships/${userId}/follow/`;
    $.ajax({
      url: link,
      method: 'POST',
      success: function (data) {
        successFollow(data, resolve);
      },
      error: function (jqXHR) {
        errorFollow(jqXHR, resolve, reject);
      },
      headers: {
        'X-CSRFToken': csrfToken,
        'x-instagram-ajax': 1,
        'eferer': 'https://www.instagram.com/' //+ obj.userName + '/'
      },
      async: true
    });
  }
};
