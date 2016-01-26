var app = angular.module('app', ['ngMaterial']);

app.service('transactionsService', ['$http', '$q', function($http, $q){
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
}]);
app.directive('transactionsAdd', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'app/components/transactions/add/view.html',
        controller: function($scope, transactionsService, $q) {
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

            this.updateData = function() {
                $scope.$emit('UPDATE_DATA_POST_COMPLETE', false);
                transactionsService.service('POST', 'transactions/', $scope.transaction).then(function() {
                    $scope.$emit('UPDATE_DATA_POST_COMPLETE', true);
                });
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
                            ctrl.updateData();
                        });
                    });
                }
            };

            scope.$on('UPDATE_DATA_GET_COMPLETE', function() {
                syncElement.fadeOut();
                button.fadeIn();
            });
        }
    }
});
app.directive('transactionsDelete', function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, transactionsService, $mdDialog, $q) {

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
                    $scope.$emit('UPDATE_DATA_POST_COMPLETE', false);
                    transactionsService.service('DELETE', 'transactions/' + transaction.id).then(function() {
                        $scope.$emit('UPDATE_DATA_POST_COMPLETE', true);
                        defer.resolve();
                    });
                }, function() {
                    // cancel
                });

                return defer.promise
            };
        },
        link: function(scope, element, attrs, ctrl) {
            var deleteTrigger = $(element).find('.transaction-delete-trigger');
            var isEditing = false;
            deleteTrigger.hide();

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
                    ctrl.deleteData(event, transaction).then(function() {
                        isEditing = false;
                    });
                });
            };
        }
    }
});
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
app.directive('transactionsTable', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            type: '@',
            filter: '='
        },
        templateUrl: 'app/components/transactions/table/view.html',
        controller: function($scope, transactionsService, $q) {
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
            $scope.$on('UPDATE_DATA_POST_COMPLETE', function(e, status){
                if(status) {
                    $scope.$emit('UPDATE_DATA_GET_COMPLETE', false);
                    transactionsService.service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){
                            runBalances(response).then(function(response){
                                $scope.transactions = response;
                                $scope.$emit('UPDATE_DATA_GET_COMPLETE', true);
                            });
                        });
                }
            });
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
            };
        }
    }
});
app.directive('transactionsTransactions', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/transactions/view.html',
        controller: function($scope, transactionsService, $q) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
});
app.directive('transactionsEdit', function() {
    return {
        restrict: 'A',
        scope: true,
        controller: function($scope, transactionsService) {
            this.isValid = function(transaction) {
                return transaction == transaction;
            };

            this.updateData = function(transaction) {
                $scope.$emit('UPDATE_DATA_POST_COMPLETE', false);
                transactionsService.service('PUT', 'transactions/' + transaction.id, transaction).then(function() {
                    $scope.$emit('UPDATE_DATA_POST_COMPLETE', true);
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

            scope.$on('UPDATE_DATA_GET_COMPLETE', function() {
                syncElement.fadeOut().promise().done(function() {
                    data.fadeIn(500).promise().done(function() {
                        isEditing = false;
                        editTrigger.show();
                    });
                });
            });
        }
    }
});
app.directive('transactionsSearch', function() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/transactions/search/view.html',
        controller: function($scope, transactionsService, $filter, $q) {
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

            this.getData = function() {
                var defer = $q.defer();

                transactionsService
                    .service('GET', 'transactions?_sort=date&_order=DESC')
                        .then(function(response){

                    $scope.transactions = $filter('filterSearchTransaction')
                        (response, $scope.filterProperties);

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

            this.startData = function() {
                var defer = $q.defer();
                defer.resolve($scope.transactions = []);
                return defer.promise;
            }
        },
        link: function(scope, element, attrs, ctrl) {
            var syncElement = $(element).find('.transaction-sync');
            var searchElement = $(element).find('.transaction-search-element');

            syncElement.hide();

            scope.search = function(event) {
                if(event) {
                    event.preventDefault(); // prevents page refresh
                }

                ctrl.startData().then(function() {
                    searchElement.fadeOut().promise().done(function() {
                        syncElement.fadeIn().promise().done(function() {
                            ctrl.getData().then(function() {
                                syncElement.fadeOut().promise().done(function() {
                                    searchElement.fadeIn();
                                });
                            });
                        });
                    });
                });
            };
        }
    }
});

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