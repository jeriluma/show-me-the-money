var app = angular.module('app', ['ngMaterial']);

app.service('transactionsService', ['$http', '$q', '$filter', '$rootScope', function($http, $q, $filter, $rootScope) {
        initStaticData().then(function() {
            $rootScope.$broadcast('transactionsService:init');
            return updateAllTransactions();
        });

        // Static Data
        var categories = [];
        this.getCategories = function() {
            return categories;
        };

        var accounts = [];
        this.getAccounts = function() {
            return accounts;
        };

        var status = [];
        this.getStatus = function() {
            return status;
        };

        function initStaticData() {
            var defer = $q.defer();
            var promises  = [];

            $http({
                method: 'GET',
                url: 'http://localhost:3000/categories'
            }).then(function successCallback(response) {
                promises.push(categories = response.data);
            });

            $http({
                method: 'GET',
                url: 'http://localhost:3000/status'
            }).then(function successCallback(response) {
                promises.push(status = response.data);
            });

            $http({
                method: 'GET',
                url: 'http://localhost:3000/accounts'
            }).then(function successCallback(response) {
                promises.push(accounts = response.data);
            });


            $q.all(promises).then(function() {
                defer.resolve();
            });

            return defer.promise;
        }

        // Account Balances
        var balances = {
            overall: 0,
            debit: 0,
            credit: 0
        };
        this.getBalances = function() {
            return balances;
        };

        // Searching Transactions
        var searchResults = [];
        this.searchTransactions = function(filter) {
            var defer = $q.defer();
            setSearchResults(filter).then(function() {
                defer.resolve($rootScope.$broadcast('transactionsService:search', true));
            });
            return defer.promise;
        };

        function setSearchResults(filter) {
            var defer = $q.defer();
            defer.resolve(searchResults = $filter('filterSearchTransaction')(allTransactions, filter));
            return defer.promise;
        }

        this.getSearchResults = function() {
            return searchResults;
        };

        // Transactions Interactions
        var allTransactions = [];

        this.addTransaction = function(transaction) {
            var defer = $q.defer();

            $http({
                method: 'POST',
                url: 'http://localhost:3000/transactions',
                data: transaction
            }).then(function successCallback(response) {
                updateAllTransactions().then(function() {
                    defer.resolve();
                });
            });

            return defer.promise;
        };

        this.addTransactions = function(transactions) {
            var defer = $q.defer();
            var promises  = [];

            angular.forEach(transactions, function(transaction) {
                $http({
                    method: 'POST',
                    url: 'http://localhost:3000/transactions',
                    data: transaction
                }).then(function successCallback(response) {
                    promises.push(response.data);
                });
            });

            $q.all(promises).then(function() {
                updateAllTransactions().then(function() {
                    defer.resolve();
                });
            });

            return defer.promise;
        };

        this.deleteTransaction = function(transactions) {
            var defer = $q.defer();

            $http({
                method: 'DELETE',
                url: 'http://localhost:3000/transactions/' + transactions.id
            }).then(function successCallback(response) {
                updateAllTransactions().then(function() {
                    defer.resolve();
                });
            });

            return defer.promise;
        };

        this.editTransaction = function(transaction) {
            var defer = $q.defer();

            $http({
                method: 'PUT',
                url: 'http://localhost:3000/transactions/' + transaction.id,
                data: transaction
            }).then(function successCallback(response) {
                updateAllTransactions().then(function() {
                    defer.resolve();
                });
            });

            return defer.promise;
        };

        var filteredCreditTransactions = [];
        this.getCreditTransactions = function() {
            return filteredCreditTransactions;
        };

        var draftTransactions = [];
        this.getDraftTransactions = function() {
            return draftTransactions;
        };

        this.getTransactions = function() {
            return allTransactions;
        };

        function updateAllTransactions() {
            var defer = $q.defer();

            $http({
                method: 'GET',
                url: 'http://localhost:3000/transactions?_sort=date&_order=DESC'
            }).then(function successCallback(response) {
                allTransactions = response.data;
                analyzeAllTransactions().then(function() {
                    defer.resolve($rootScope.$broadcast('transactionsService:updated', true));
                });
            });

            return defer.promise;
        }

        function analyzeAllTransactions() {
            var defer = $q.defer();

            filteredCreditTransactions = [];
            draftTransactions = [];

            var categoryState;
            var totalBalance = 0;
            var debitBalance = 0;
            var creditBalance = 0;

            for(var i = allTransactions.length - 1; i >= 0; i--) {
                var transaction = allTransactions[i];

                // category state
                if(categories[transaction.categoryId]
                    && categories[transaction.categoryId].parentId === "Expense") {
                    categoryState = -1;
                } else {
                    categoryState = 1;
                }

                // balances
                transaction.balance = totalBalance + categoryState * transaction.amount;
                totalBalance = transaction.balance;

                // debit balance
                if(transaction.accountId === 0) {
                    debitBalance += categoryState * transaction.amount;
                }

                // credit pending/unpaid balance
                if(transaction.accountId === 1 && (transaction.statusId === 1 || transaction.statusId === 3)) {
                    creditBalance += transaction.amount;
                    filteredCreditTransactions.push(transaction);
                }

                // draft transaction
                if(transaction.statusId === 0) {
                    draftTransactions.push(transaction);
                }
            }

            balances.debit = debitBalance;
            balances.credit = creditBalance;
            balances.overall = debitBalance + creditBalance;

            defer.resolve();

            return defer.promise;
        }
    }]);

app.filter('filterSearchTransaction', ['$filter', function($filter) {
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
app.directive('transactionsAdd', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/add/view.html',
        controller: function($scope, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
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

            $scope.$on('transactionsService:init', function() {
                $scope.categories = transactionsService.getCategories();
                $scope.status = transactionsService.getStatus();
                $scope.accounts = transactionsService.getAccounts();
            });

            this.isValid = function() {
                return ($scope.transaction.description !== '') && ($scope.transaction.amount !== 0);
            };

            this.updateData = function() {
                var defer = $q.defer();
                transactionsService.addTransaction($scope.transaction).then(function() {
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
                    defer.resolve();
                });

                return defer.promise;
            };
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
                            ctrl.updateData().then(function() {
                                syncElement.fadeOut().promise().then(function() {
                                    button.fadeIn();
                                });
                            });
                        });
                    });
                }
            };

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

            $scope.$on('transactionsService:updated', function() {
                $scope.balance = transactionsService.getBalances();
            });
        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
}]);
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
                return transactionsService.editTransaction(transaction);
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

            this.updateData = function(transaction) {
                return transactionsService.deleteTransaction(transaction);
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
                                    ctrl.updateData(transaction).then(function() {
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
app.directive('transactionsSearch', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        controller: function($scope, $filter, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];

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

            $scope.$on('transactionsService:updated', function() {
                $scope.categories = transactionsService.getCategories();
                $scope.status = transactionsService.getStatus();
                $scope.accounts = transactionsService.getAccounts();
            });

            this.searchData = function() {
                var defer = $q.defer();
                transactionsService.searchTransactions($scope.filterProperties).then(function(response) {
                    $scope.transactions = response;
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
                    defer.resolve();
                });
                return defer.promise;
            };

        },
        link: function(scope, element, attrs, ctrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');

            syncElement.hide();

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                searchElement.fadeOut().promise().done(function() {
                    syncElement.fadeIn().promise().done(function() {
                        ctrl.searchData().then(function() {
                            syncElement.fadeOut().promise().done(function() {
                                searchElement.fadeIn();
                            });
                        });
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
        controller: function($scope, transactionsService) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            $scope.headers = ['Date', 'Description', 'Account', 'Category', 'Amount', 'Balance', 'Status'];
            $scope.transactions = [];

            $scope.transformDate = function(date) {
                return new Date(date);
            };

            $scope.$on('transactionsService:init', function() {
                $scope.categories = transactionsService.getCategories();
                $scope.status = transactionsService.getStatus();
                $scope.accounts = transactionsService.getAccounts();
            });

            $scope.$on('transactionsService:updated', function() {
                if($scope.type === 'credit') {
                    $scope.transactions = transactionsService.getCreditTransactions();
                } else if($scope.type === 'draft') {
                    $scope.transactions = transactionsService.getDraftTransactions();
                } else if(typeof $scope.type === 'undefined'){
                    $scope.transactions = transactionsService.getTransactions();
                }
            });

            $scope.$on('transactionsService:search', function() {
                $scope.transactions = transactionsService.getSearchResults();
            });
        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});