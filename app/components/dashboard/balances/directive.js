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