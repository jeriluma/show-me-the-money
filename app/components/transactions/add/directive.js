app.directive('transactionsAdd', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        templateUrl: 'app/components/transactions/add/view.html',
        controller: function($scope, transactionsService, $q) {
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

            function initTransactions() {
                var defer = $q.defer();
                var promises  = [];

                transactionsService.service('GET', 'categories').then(function(response){
                    promises.push($scope.categories = response);
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

            initTransactions();

            this.isValid = function() {
                return ($scope.transaction.description !== '') && ($scope.transaction.amount !== 0);
            };

            this.updateData = function() {
                $scope.$emit('UPDATE_DATA_POST_COMPLETE', false);
                transactionsService.service('POST', 'transactions/', $scope.transaction).then(function() {
                    $scope.$emit('UPDATE_DATA_POST_COMPLETE', true);
                });
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
                            ctrl.updateData();
                        });
                    });
                }
            };

            scope.$on('UPDATE_DATA_GET_COMPLETE', function() {
                syncElement.fadeOut();
                button.fadeIn();
            });
        }
    }
});