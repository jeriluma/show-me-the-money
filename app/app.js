var app = angular.module('app', []);

app.service('transactionsService', ['$http', '$q', function($http, $q){
    this.service = function (method, url, data) {
        var defer = $q.defer();

        setTimeout(function() {
            $http({
                method: method,
                url: 'http://localhost:3000/' + url,
                data: data
            }).then(function successCallback(response) {
                defer.resolve(response.data);
            }, function errorCallback(response) {
                defer.reject(response.statusText);
            });
        }, 50);

        return defer.promise;
    };
}]);
