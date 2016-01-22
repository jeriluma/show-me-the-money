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

                transactionsService.service('GET', 'transactions?accountId=0').then(function(response){
                    var balance = {
                        overall: 0,
                        debit: 0,
                        credit: 0
                    };

                    angular.forEach(response, function(transaction) {
                        balance.debit += transaction.amount;
                    });

                    transactionsService.service('GET', 'transactions?accountId=1').then(function(response){
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