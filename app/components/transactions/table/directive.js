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