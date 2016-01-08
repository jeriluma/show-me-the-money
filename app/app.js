var app = angular.module('app', []);

app.service('transactionsService', ['$http', '$q', function($http, $q){
    this.service = function (method, url, data) {
        var deferred = $q.defer();

        $http({
            method: method,
            url: 'http://localhost:3000/' + url,
            data: data
        }).then(function successCallback(response) {
            deferred.resolve(response.data);
        }, function errorCallback(response) {
            deferred.reject(response.statusText);
        });

        return deferred.promise;
    };
}]);
