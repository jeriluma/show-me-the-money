app.directive('dashboardCharts', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/dashboard/charts/view.html',
        controller: function($scope) {

        },
        link: function(scope, element, attrs, ctrl) {

        }
    }
}]);