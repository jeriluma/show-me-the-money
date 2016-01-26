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