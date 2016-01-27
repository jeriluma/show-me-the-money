app.directive('dashboard', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/dashboard/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
}]);