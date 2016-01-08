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

app.directive('transactionsAdd', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/add/view.html',
        require: '?transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {

        }
    }
});
app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionsCtrl) {
            var editTrigger = $(element).find('.transaction-edit-hover');
            var editingElement = $(element).find('.transaction-editing');
            var isEditing = false;

            editTrigger.hide();
            editingElement.hide();

            $(element).bind('mouseover', function() {
                if(!isEditing) {
                    editTrigger.fadeIn();
                }
            });

            $(element).bind('mouseleave', function() {
                if(!isEditing) {
                    editTrigger.fadeOut();
                }
            });

            $(editTrigger).bind('click', function() {
                $(element).children().hide();
                isEditing = true;
                editingElement.fadeIn();
            });

            // Issue: submits for all
            scope.save = function(transaction, event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                transactionsCtrl.editTransaction(transaction);
                isEditing = false;
                editingElement.fadeOut();
            };


        }
    }
});
app.directive('transactionsSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        require: '?transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {

        }
    }
});
app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $filter) {
            transactionsService.service('GET', 'categories').then(function(response){
                $scope.categories = response;
            });

            transactionsService.service('GET', 'status').then(function(response){
                $scope.status = response;
            });

            transactionsService.service('GET', 'accounts').then(function(response){
                $scope.accounts = response;
            });

            transactionsService.service('GET', 'transactions').then(function(response){
                $scope.headers = ['Date', 'Description', 'Account', 'Categories', 'Amount', 'Balance', 'Status'];
                $scope.getAccountName = function(transaction) {
                    return $filter('filter')($scope.accounts, function (d) {return d.id === transaction.id;})[0].name;
                };
                $scope.transactions = response;
            });

            $scope.addTransaction = function(transaction) {
                transactionsService.service('POST', 'transactions', transaction).then(getTransactions());
            };

            $scope.deleteTransaction = function(transaction) {
                transactionsService.service('DELETE', 'transactions/' + transaction.id).then(getTransactions());
            };

            this.editTransaction = function(transaction) {
                transactionsService.service('PUT', 'transactions/' + transaction.id, transaction).then(getTransactions());
            };

            function getTransactions() {
                transactionsService.service('GET', 'transactions').then(function(response){
                    $scope.transactions = response;
                });
            }

        },
        link: function(scope, element, attrs) {


        }
    }
});