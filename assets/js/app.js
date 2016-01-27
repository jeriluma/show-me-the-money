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
app.directive('transactionsDelete', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, $mdDialog, $q) {

            this.deleteData = function(ev, transaction) {
                var defer = $q.defer();
                var translation = transaction.description;

                var confirm = $mdDialog.confirm()
                    .title('Would you like to delete this transaction?')
                    .textContent(translation)
                    .ariaLabel(transaction.description)
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');

                $mdDialog.show(confirm).then(function() {
                    defer.resolve('delete');
                }, function() {
                    defer.resolve('cancel');
                });

                return defer.promise
            };
        },
        link: function(scope, element, attrs, ctrl) {
            var deleteTrigger = $(element).find('.transaction-delete-trigger');
            var syncElement = $(element).find('.transaction-sync');
            var isEditing = false;
            deleteTrigger.hide();
            syncElement.hide();

            $(element).bind('mouseover', function() {
                if(!isEditing) {
                    deleteTrigger.fadeIn();
                }
            });

            $(element).bind('mouseleave', function() {
                if(!isEditing) {
                    deleteTrigger.fadeOut();
                }
            });

            scope.delete = function(event, transaction) {
                isEditing = true;
                deleteTrigger.fadeIn().promise().then(function() {
                    ctrl.deleteData(event, transaction).then(function(response) {
                        if(response === 'delete') {
                            deleteTrigger.fadeOut().promise().then(function() {
                                syncElement.fadeIn().promise().then(function() {
                                    transactionsService.service('DELETE', 'transactions/' + transaction.id).then(function() {
                                        transactionsService.setUpdateStatus(1);
                                        isEditing = false;
                                    });
                                });
                            });
                        } else { // cancel
                            deleteTrigger.fadeOut().promise().then(function() {
                                    isEditing = false;
                            });
                        }
                    });
                });
            };
        }
    }
}]);
app.directive('transactionsSummary', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/summary/view.html',
        controller: function($scope, transactionsService, $filter, $q) {
            $scope.balance = {
                overall: '',
                debit: '',
                credit: ''
            };

            this.init = function() {
                var defer = $q.defer();

                transactionsService.service('GET', 'transactions?accountId=0&statusId=1&statusId=2').then(function(response){
                    var balance = {
                        overall: 0,
                        debit: 0,
                        credit: 0
                    };

                    angular.forEach(response, function(transaction) {
                        balance.debit += transaction.amount;
                    });

                    transactionsService.service('GET', 'transactions?accountId=1&statusId=1&statusId=3').then(function(response){
                        angular.forEach(response, function(transaction) {
                            balance.credit += transaction.amount;
                        });

                        balance.overall = balance.debit - balance.credit;

                        balance.overall = $filter('currency')(balance.overall, "$");
                        balance.debit = $filter('currency')(balance.debit, "$");
                        balance.credit = $filter('currency')(balance.credit, "$");

                        $scope.balance = balance;

                        defer.resolve();
                    });
                });

                return defer.promise;
            }

        },
        link: function(scope, element, attrs, ctrl) {
            var content = $(element).find("p");
            content.hide();
            ctrl.init().then(function() {
                content.fadeIn();
            });
        }
    }
});
app.directive('transactionsSearch', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        controller: function($scope, $filter, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account',
                'Category', 'Amount', 'Balance', 'Status'];
            $scope.transactions = [];
            var date = new Date();
            $scope.filterProperties = {
                date: {
                    start: null,
                    end: date
                },
                description: '',
                accountId: '',
                categoryId: '',
                statusId: ''
            };

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

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
            initTransactions();

        },
        link: function(scope, element, attrs, ctrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');
            var isSearching = false;

            syncElement.hide();

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                searchElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        transactionsService.setFilterProperties(scope.filterProperties).then(function(){
                            isSearching = true;
                            transactionsService.setSearchStatus(1);
                        });

                    });
                });
            };

            scope.$on('transactions:search', function(event, data) {
                if(transactionsService.getSearchStatus() === 2 && isSearching) {
                    syncElement.fadeOut().promise().done(function() {
                        searchElement.fadeIn().promise().done(function() {
                            isSearching = false;
                            var date = new Date();
                            scope.filterProperties = {
                                date: {
                                    start: null,
                                    end: date
                                },
                                description: '',
                                accountId: '',
                                categoryId: '',
                                statusId: ''
                            };
                            scope.$apply();
                            transactionsService.setSearchStatus(0);
                        });
                    });
                }
            });
        }
    }
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
app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($rootScope, $scope, transactionsService) {
            this.isValid = function(transaction) {
                return transaction == transaction;
            };

            this.updateData = function(transaction) {
                transactionsService.service('PUT', 'transactions/' + transaction.id, transaction).then(function() {
                    transactionsService.setUpdateStatus(1);
                });
            };
        },
        link: function(scope, element, attrs, ctrl) {
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

                if(ctrl.isValid(transaction)) {
                    editingElement.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            ctrl.updateData(transaction);
                        });
                    });
                }
            };
        }
    }
});
app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            type: '@'
        },
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $q, $filter) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];

            initTransactions().then(function() {
                if($scope.type !== 'search') {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){
                            runBalances(response).then(function(response){
                                $scope.transactions = response;
                            });
                        });
                }
            });

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

                transactionsService.service('GET', 'categories').then(function(response){
                    $scope.categories = response;
                    promises.push();
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

            $scope.transformDate = function(date) {
                return new Date(date);
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

            // Updating Transactions
            $scope.$on('transactions:updated', function(event, data) {
                if(transactionsService.getUpdateStatus() === 1 && $scope.type !== 'search') {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){
                            runBalances(response).then(function(response){
                                    $scope.transactions = response;
                                    transactionsService.setUpdateStatus(2);
                            });
                        });
                }
            });

            // Search Transactions
            $scope.$on('transactions:search', function(event, data) {
                if(transactionsService.getSearchStatus() === 1) {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){
                            runBalances(response).then(function(response){
                                $scope.transactions = $filter('filterSearchTransaction')(response, transactionsService.getFilterProperties());
                                transactionsService.setSearchStatus(2);
                            });
                        });
                }
            });

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});
app.directive('transactionsAdd', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/add/view.html',
        controller: function($scope, $q) {
            var date = new Date();
            $scope.transaction = {
                date: date,
                description: "",
                accountId: 0,
                categoryId: 0,
                statusId: 0,
                parentId: 0,
                amount: null
            };

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

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

            initTransactions();

            this.isValid = function() {
                return ($scope.transaction.description !== '') && ($scope.transaction.amount !== 0);
            };

            $scope.isUpdating = false;
            this.updateData = function() {
                transactionsService.service('POST', 'transactions/', $scope.transaction).then(function() {
                    $scope.isUpdating = true;
                    transactionsService.setUpdateStatus(1);
                });
            };

            this.updateDone = function() {
                $scope.isUpdating = false;
                transactionsService.setUpdateStatus(0);

                var date = new Date();
                $scope.transaction = {
                    date: date,
                    description: "",
                    accountId: 0,
                    categoryId: 0,
                    statusId: 0,
                    parentId: 0,
                    amount: null
                };
                $scope.$apply();
            }
        },
        link: function(scope, element, attrs, ctrl) {
            var form = $(element).find('.transaction-form');
            var syncElement = $(element).find('.transaction-sync');
            var button = $(element).find('.transaction-submit');

            syncElement.hide();

            scope.add = function (event) {
                event.preventDefault(); // prevents page refresh

                if(ctrl.isValid()) {
                    button.fadeOut().promise().done(function () {
                        syncElement.fadeIn().promise().done(function () {
                            ctrl.updateData();
                        });
                    });
                }
            };

            scope.$on('transactions:updated', function(event, data) {
                if(transactionsService.getUpdateStatus() === 2 && scope.isUpdating) {
                    syncElement.fadeOut().promise().then(function() {
                        button.fadeIn().promise().then(function() {
                            ctrl.updateDone();
                        });
                    });
                }
            });

        }
    }
}]);
app.directive('transactionsTransactions', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/transactions/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});