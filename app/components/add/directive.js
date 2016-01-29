app.directive('transactionsAdd', ['transactionsService', function(transactionsService) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'app/components/add/view.html',
        controller: function($scope, $q) {
            $scope.categories = [];
            $scope.status = [];
            $scope.accounts = [];
            var date = new Date();
            $scope.transaction = {
                date: date,
                description: "",
                accountId: 0,
                categoryId: 0,
                statusId: 0,
                parentId: 0,
                amount: null
            };

            $scope.$on('transactionsService:init', function() {
                $scope.categories = transactionsService.getCategories();
                $scope.status = transactionsService.getStatus();
                $scope.accounts = transactionsService.getAccounts();
            });

            this.isValid = function() {
                return ($scope.transaction.description !== '') && ($scope.transaction.amount !== 0);
            };

            this.updateData = function() {
                var defer = $q.defer();
                transactionsService.addTransaction($scope.transaction).then(function() {
                    var date = new Date();
                    $scope.transaction = {
                        date: date,
                        description: "",
                        accountId: 0,
                        categoryId: 0,
                        statusId: 0,
                        parentId: 0,
                        amount: null
                    };
                    defer.resolve();
                });

                return defer.promise;
            };
        },
        link: function(scope, element, attrs, ctrl) {
            var form = $(element).find('.transaction-form');
            var syncElement = $(element).find('.transaction-sync');
            var button = $(element).find('.transaction-submit');

            syncElement.hide();

            scope.add = function (event) {
                event.preventDefault(); // prevents page refresh

                if(ctrl.isValid()) {
                    button.fadeOut().promise().done(function () {
                        syncElement.fadeIn().promise().done(function () {
                            ctrl.updateData().then(function() {
                                syncElement.fadeOut().promise().then(function() {
                                    button.fadeIn();
                                });
                            });
                        });
                    });
                }
            };

        }
    }
}]);