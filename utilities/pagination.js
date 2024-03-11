function getAggregationPipeline(limit, matchStage, sortStage) {
    return [
        {
            $match: matchStage
        },
        {
            $sort: sortStage
        },
        {
            $facet: {
                metadata: [{ $count: 'count' }],
                results: [{ $limit: limit }]
            }
        },
        {
            $addFields: {
                metadata: {
                    $mergeObjects: [
                        { $arrayElemAt: ['$metadata', 0] },
                        {
                            nextPageParams: {
                                $cond: {
                                    if: { $eq: [{ $size: '$results' }, limit] },
                                    then: {
                                        $let: {
                                            vars: {
                                                lastElement: {
                                                    $arrayElemAt: [
                                                        '$results',
                                                        -1
                                                    ]
                                                }
                                            },
                                            in: {
                                                _id: '$$lastElement._id',
                                                createdAt:
                                                    '$$lastElement.createdAt'
                                            }
                                        }
                                    },
                                    else: null
                                }
                            }
                        }
                    ]
                }
            }
        }
    ];
}

module.exports = getAggregationPipeline;
