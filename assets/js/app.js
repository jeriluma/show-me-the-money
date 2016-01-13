var app = angular.module('app', ['ngMaterial']);

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

app.directive('transactionsAdd', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'app/components/transactions/add/view.html',
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {
            var form = $(element).find('.transaction-form');
            var syncElement = $(element).find('.transaction-sync');

            syncElement.hide();

            scope.transaction = {
                date: "2016-01-03",
                description: "",
                accountId: 0,
                categoryId: 0,
                statusId: 0,
                parentId: 0,
                amount: "0"
            };

            scope.add = function(event) {
                event.preventDefault(); // prevents page refresh

                if(valid()) {
                    syncElement.fadeIn().promise().done(function() {
                        transactionCtrl.add(scope.transaction).then(function() {
                            syncElement.fadeOut();
                        });
                    });
                } else {

                }
            };

            function valid() {
                var isValid = true;

                if(scope.transaction.description === '') {
                    isValid = false;
                }

                if(scope.transaction.amount === 0) {
                    isValid = false;
                }

                return isValid;
            }
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
            transactionsServiceInit();

            function transactionsServiceInit() {
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
                    $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
                    $scope.transactions = response;
                    $scope.loading = false;
                });
            }

            this.add = function(transaction) {
                return updateTransactions('POST', 'transactions/', transaction);
            };

            this.edit = function(transaction) {
                return updateTransactions('PUT', 'transactions/' + transaction.id, transaction);
            };

            var checkedIds = [];
            $scope.checked = function(transaction) {
                if(checkedIds.indexOf(transaction.id) !== -1) {
                    checkedIds.splice(checkedIds.indexOf(transaction.id), 1);
                } else {
                    checkedIds.push(transaction.id);
                }
            };

            this.delete = function() {
                var defer = $q.defer();
                var promises  = [];

                angular.forEach(checkedIds,function(id){
                    promises.push(updateTransactions('DELETE', 'transactions/' + id));
                });

                $q.all(promises).then(function() {
                    checkedIds = [];
                    defer.resolve();
                });

                return defer.promise;
            };

            function updateTransactions(method, url, transaction) {
                var defer = $q.defer();

                transactionsService.service(method, url, transaction).then(function() {
                    transactionsService.service('GET', 'transactions').then(function(response){
                        $scope.transactions = response;
                        defer.resolve();
                    });
                });

                return defer.promise;
            }

        },
        link: function(scope, element, attrs, ctrl) {
            var deleteElement = $(element).find('.transactions.delete .transaction-delete');
            var syncElement = $(element).find('.transactions.delete .transaction-sync');
            syncElement.hide();

            scope.delete = function() {
                deleteElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        ctrl.delete().then(function() {
                            syncElement.fadeOut().promise().done(function(){
                                deleteElement.fadeIn();
                            });
                        });
                    });
                });
            }
        }
    }
});