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