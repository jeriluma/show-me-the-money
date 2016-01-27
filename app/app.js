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

    var filterStatus = 0;
    this.setFilterStatus = function(statusId) {
        filterStatus = statusId;
        $rootScope.$broadcast('transactions:filter', true);
    };

    this.getFilterStatus = function() {
        return filterStatus;
    };
}]);

app.filter('filterSearchTransaction', ['$filter', '$q', function($filter) {
    return function(input, filterOptions) {
        var output = [];

        angular.forEach(input, function(transaction) {
            transaction.date = new Date(transaction.date);
            var validStartDate = filterOptions.date.start === null
                || transaction.date >= filterOptions.date.start;
            var validEndDate =  transaction.date <= filterOptions.date.end;
            var validAccountId = filterOptions.accountId === ''
                || transaction.accountId === filterOptions.accountId;
            var validCategoryId = filterOptions.categoryId === ''
                || transaction.categoryId === filterOptions.categoryId;
            var validStatusId = filterOptions.statusId === ''
                || transaction.statusId === filterOptions.statusId;

            if(validStartDate && validEndDate && validAccountId && validCategoryId && validStatusId) {
                output.push(transaction);
            }
        });

        if(filterOptions.description !== '') {
            output = $filter('filter')(output, filterOptions.description);
        }

        return output;
    }
}]);

app.filter('filterCreditTransactions', ['$filter', '$q', function($filter) {
    return function(input, filterOptions) {
        var output = [];

        angular.forEach(input, function(transaction) {
            var validAccountId = transaction.accountId === 1;
            var validStatusId = (transaction.statusId === 1 || transaction.statusId === 3);

            if(validAccountId && validStatusId) {
                output.push(transaction);
            }
        });


        return output;
    }
}]);

app.filter('filterDraftTransactions', ['$filter', '$q', function($filter) {
    return function(input, filterOptions) {
        var output = [];

        angular.forEach(input, function(transaction) {
            if(transaction.statusId === 0) {
                output.push(transaction);
            }
        });


        return output;
    }
}]);