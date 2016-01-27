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