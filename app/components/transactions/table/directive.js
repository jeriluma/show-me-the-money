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