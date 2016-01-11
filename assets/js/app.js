var app = angular.module('app', []);

app.service('transactionsService', ['$http', '$q', function($http, $q){
    this.service = function (method, url, data) {
        var deferred = $q.defer();

        setTimeout(function() {
            $http({
                method: method,
                url: 'http://localhost:3000/' + url,
                data: data
            }).then(function successCallback(response) {
                deferred.resolve(response.data);
            }, function errorCallback(response) {
                deferred.reject(response.statusText);
            });
        }, 100);

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
        controller: function($scope, transactionsService, $q) {
            $scope.loading = true;

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
                $scope.headers = ['ID', 'Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
                $scope.transactions = response;
                $scope.loading = false;
            });

            this.add = function(transaction) {
                return updateTransactions('POST', 'transactions/' + transaction, transaction);
            };

            this.delete = function(transaction) {
                return updateTransactions('DELETE', 'transactions/' + transaction.id, transaction);
            };

            this.edit = function(transaction) {
                return updateTransactions('PUT', 'transactions/' + transaction.id, transaction);
            };

            function updateTransactions(method, url, transaction) {
                var deferred = $q.defer();

                transactionsService.service(method, url, transaction).then(function() {
                    transactionsService.service('GET', 'transactions').then(function(response){
                        $scope.transactions = response;
                        deferred.resolve(true);
                    });
                });

                return deferred.promise;
            }

        },
        link: function(scope, element, attrs) {

        }
    }
});
app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        require: '^transactionsTable',
        scope: true,
        link: function(scope, element, attrs, transactionsCtrl) {
            var data = $(element).find('.transaction-data');
            var editTrigger = $(element).find('.transaction-edit-trigger');
            var editingElement = $(element).find('.transaction-edit');
            var syncElement = $(element).find('.transaction-sync');
            var isEditing = false;

            editTrigger.hide();
            editingElement.hide();
            syncElement.hide();

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
                data.fadeOut().promise().done(function() {
                    isEditing = true;
                    editingElement.fadeIn();
                    editTrigger.hide();
                });
            });

            scope.save = function(transaction, event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                editingElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        transactionsCtrl.edit(transaction).then(function () {
                            syncElement.fadeOut().promise().done(function() {
                                data.fadeIn(500).promise().done(function() {
                                    isEditing = false;
                                    editTrigger.show();
                                });
                            });
                        });
                    });
                });
            };

        }
    }
});