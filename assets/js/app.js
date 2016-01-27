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
app.directive('transactionsAdd', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/add/view.html',
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
app.directive('dashboard', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/dashboard/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
}]);
app.directive('transactionsSummary', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/summary/view.html',
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
app.directive('transactionsTransactions', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});
app.directive('dashboardCharts', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/dashboard/charts/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
}]);
app.directive('dashboardBalances', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/dashboard/balances/view.html',
        controller: function($scope, $q) {
            $scope.balance = {
                overall: 0,
                debit: 0,
                credit: 0
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

                defer.resolve(totalBalance);

                return defer.promise;
            }


            $scope.isBalancing = true;
            transactionsService.service('GET', 'transactions?_sort=date&_order=DESC&accountId=0')
                .then(function(response){
                    runBalances(response).then(function(response){
                        $scope.balance.debit = response;
                        transactionsService.service('GET', 'transactions?_sort=date&_order=DESC&accountId=1')
                            .then(function(response){
                                runBalances(response).then(function(response){
                                    $scope.balance.credit = response;
                                    $scope.balance.overall = $scope.balance.debit + $scope.balance.credit;
                                    $scope.isBalancing = false;
                                });
                        });
                    });
            });

        },
        link: function(scope, element, attrs, ctrl) {
            var balances = $(element).find('.content p');
            balances.hide();

            scope.$watch('isBalancing', function() {
                if(!scope.isBalancing) {
                    balances.fadeIn();
                }
            })
        }
    }
}]);
app.directive('dashboardTransactions', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/dashboard/transactions/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
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

            this.searchDone = function() {
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
                $scope.$apply();
                transactionsService.setFilterStatus(0);
            }

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
                        isSearching = true;
                        transactionsService.setFilterStatus(1);
                    });
                });
            };

            scope.$on('transactions:filter', function(event, data) {
                if(transactionsService.getFilterStatus() === 2 && isSearching) {
                    syncElement.fadeOut().promise().done(function() {
                        searchElement.fadeIn().promise().done(function() {
                            isSearching = false;
                            ctrl.searchDone();
                        });
                    });
                }
            });
        }
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
app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            type: '@',
            filter: '='
        },
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $q, $filter) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];

            initTransactions().then(function() {
                if(typeof $scope.type === 'undefined' || $scope.type === 'credit' || $scope.type === 'draft') {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){
                            runBalances(response).then(function(response){
                                setTransactions(response);
                            });
                        });
                }
            });

            function setTransactions(response) {
                if(typeof $scope.type === 'undefined') {
                    $scope.transactions = response;
                } else {
                    var filterType = '';
                    if($scope.type === 'credit') {
                        filterType = 'filterCreditTransactions';
                    } else {
                        filterType = 'filterDraftTransactions';
                    }
                    $scope.transactions = $filter(filterType)(response);
                }
            }

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
                                    setTransactions(response);
                                    transactionsService.setUpdateStatus(2);
                            });
                        });
                }
            });

            // Filter Transactions
            $scope.$on('transactions:filter', function(event, data) {
                if(transactionsService.getFilterStatus() === 1 && typeof $scope.filter !== 'undefined') {
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){
                            runBalances(response).then(function(response){
                                $scope.transactions = $filter('filterSearchTransaction')(response, $scope.filter);
                                transactionsService.setFilterStatus(2);
                            });
                        });
                }
            });
        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});