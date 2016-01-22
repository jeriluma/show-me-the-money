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
            var button = $(element).find('.transaction-submit');

            syncElement.hide();

            var date = new Date();

            scope.transaction = {
                date: date,
                description: "",
                accountId: 0,
                categoryId: 0,
                statusId: 0,
                parentId: 0
            };

            scope.add = function(event) {
                event.preventDefault(); // prevents page refresh

                if(valid()) {
                    button.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            transactionCtrl.add(scope.transaction).then(function() {
                                syncElement.fadeOut().promise().done(function() {
                                    button.fadeIn();
                                });
                            });
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
            var isHover = false;
            var isEditing = false;

            editTrigger.hide();
            editingElement.hide();
            syncElement.hide();

            $(element).bind('mouseover', function() {
                $(element).removeClass('pointer');
                if(!isEditing) {
                    $(element).addClass('pointer');
                    editTrigger.fadeIn().promise().done(function() {
                        isHover = true;
                    });
                }
            });

            $(element).bind('mouseleave', function() {
                $(element).removeClass('pointer');
                if(!isEditing) {
                    $(element).addClass('pointer');
                    editTrigger.fadeOut().promise().done(function() {
                        isHover = false;
                    });
                }
            });

            $(element).bind('click', function() {
                if(isHover) {
                    isEditing = true;
                    isHover = false;
                    editTrigger.hide().promise().done(function() {
                        data.fadeOut().promise().done(function() {
                            editingElement.fadeIn();
                        });
                    });
                }
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
        require: '^transactionsTable',
        link: function(scope, element, attrs, transactionCtrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');

            syncElement.hide();

            var date = new Date();
            scope.transaction = {
                date: {
                    start: null,
                    end: date
                },
                description: '',
                accountId: '',
                categoryId: '',
                statusId: ''
            };

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                searchElement.fadeOut().promise().done(function() {
                    transactionCtrl.hideTable().then(function() {
                        syncElement.fadeIn().promise().done(function() {
                            transactionCtrl.search(scope.transaction).then(function() {
                                syncElement.fadeOut().promise().done(function() {
                                    searchElement.fadeIn();
                                    transactionCtrl.showTable();
                                });
                            });
                        });
                    });
                });
            };
        }
    }
});

app.filter('filterSearchTransaction', ['$filter', '$q', function($filter, $q) {
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
app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $q, $filter, $timeout) {

            // Initialization

            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = [];

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

                promises.push($scope.loading = true);

                transactionsService.service('GET', 'categories').then(function(response){
                    promises.push($scope.categories = response);
                });

                transactionsService.service('GET', 'status').then(function(response){
                    promises.push($scope.status = response);
                });

                transactionsService.service('GET', 'accounts').then(function(response){
                    promises.push($scope.accounts = response);
                });

                $q.all(promises).then(function() {
                    defer.resolve();
                });

                return defer.promise;
            }

            initTransactions().then(function() {
                transactionsService.service('GET', 'transactions?_sort=date&_order=DESC').then(function(response){
                    runBalances(response).then(function(response){
                        $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
                        $scope.transactions = response;
                        $scope.loading = false;
                    });
                });
            });

            $scope.transformDate = function(date) {
                return new Date(date);
            };

            $scope.formatDate = function(date) {
                return (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
            };

            function runBalances(transactions) {
                var defer = $q.defer();

                var totalBalance = 0;
                var categoryState = 1;
                for(var i = transactions.length - 1; i >= 0; i--) {
                    var transaction = transactions[i];

                    if($scope.categories[transaction.categoryId]
                        && $scope.categories[transaction.categoryId].parentId === "Expense") {
                        categoryState = -1;
                    } else {
                        categoryState = 1;
                    }

                    transaction.balance = totalBalance + categoryState * transaction.amount;
                    totalBalance = transaction.balance;
                }

                defer.resolve(transactions);

                return defer.promise;
            }

            // questionable how fast this will run...
            function updateTransactions(method, url, transaction) {
                var defer = $q.defer();

                transactionsService.service(method, url, transaction).then(function() {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC').then(function(response){
                        runBalances(response).then(function(response){
                            $scope.transactions = response;
                            defer.resolve();
                        });
                    });
                });

                return defer.promise;
            }

            // Adding Transactions

            this.add = function(transaction) {
                return updateTransactions('POST', 'transactions/', transaction);
            };

            // Editing Transactions

            var editing = false;
            this.edit = function(transaction) {
                var defer = $q.defer();

                editing = true;
                updateTransactions('PUT', 'transactions/' + transaction.id, transaction).then(function() {
                    editing = false;
                    defer.resolve();
                });

                return defer.promise;
            };

            this.isEditing = function() {
                return editing === true;
            };

            // Deleting Transactions

            var checkedIds = [];
            $scope.checked = function(transaction) {
                if(checkedIds.indexOf(transaction.id) !== -1) {
                    checkedIds.splice(checkedIds.indexOf(transaction.id), 1);
                } else {
                    checkedIds.push(transaction.id);
                }
            };

            this.hasCheckedIds = function() {
                return checkedIds.length > 0;
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

            // Search / Filtering Transactions
            var newTransactions = [];
            this.search = function(filterProperties) {

                var defer = $q.defer();

                transactionsService.service('GET', 'transactions?_sort=date&_order=DESC').then(function(response){
                    runBalances(response).then(function(response){
                        defer.resolve(newTransactions = $filter('filterSearchTransaction')(response, filterProperties));
                    });
                });

                return defer.promise;
            };

            this.hideTable = function() {
                var defer = $q.defer();

                $scope.transactions = [];
                $scope.$apply();
                defer.resolve();

                return defer.promise;
            };

            this.showTable = function() {
                $scope.transactions = newTransactions;
                $scope.$apply();
            }
        },
        link: function(scope, element, attrs, ctrl) {
            var deleteElement = $(element).find('.transaction-delete');
            var syncElement = $(element).find('.transaction-sync');
            syncElement.hide();

            scope.delete = function() {
                if(ctrl.hasCheckedIds()) {
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
    }
});