var app = angular.module('app', ['ngMaterial']);

app.service('transactionsService', ['$http', '$q', function($http, $q){
    this.service = function (method, url, data) {
        var defer = $q.defer();

        $http({
            method: method,
            url: 'http://localhost:3000/' + url,
            data: data
        }).then(function successCallback(response) {
            defer.resolve(response.data);
        }, function errorCallback(response) {
            defer.reject(response.statusText);
        });

        return defer.promise;
    };
}]);