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