var app = angular.module('app', ['ngMaterial']);

app.service('transactionsService', ['$http', '$q', '$rootScope', function($http, $q, $rootScope){
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

    // 0: no updates
    // 1: post done
    // 2: get done
    var dataStatus = 0;

    this.setUpdateStatus = function(statusId) {
        dataStatus = statusId;
        $rootScope.$broadcast('transactions:updated', true);
    };

    this.getUpdateStatus = function() {
        return dataStatus;
    };

    var searchStatus = 0;
    this.setSearchStatus = function(statusId) {
        searchStatus = statusId;
        $rootScope.$broadcast('transactions:search', true);
    };

    this.getSearchStatus = function() {
        return searchStatus;
    };

    var filterProperties = {};
    this.setFilterProperties = function(filter) {
        var defer = $q.defer();
        defer.resolve(filterProperties = filter);
        return defer.promise;
    };

    this.getFilterProperties = function() {
        return filterProperties;
    }
}]);