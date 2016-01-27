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