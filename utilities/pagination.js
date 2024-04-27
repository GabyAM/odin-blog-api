function getAggregationPipeline(
    limit,
    searchStage,
    matchStage,
    sortStage,
    resultsProjection = []
) {
    const pipeline = [];
    if (searchStage) {
        pipeline.push({ $search: searchStage });
    }
    pipeline.push(
        ...[
            {
                $match: matchStage
            },
            {
                $sort: sortStage
            },
            {
                $facet: {
                    metadata: [{ $count: 'count' }],
                    results: [{ $limit: limit }, ...resultsProjection]
                }
            },
            {
                $addFields: {
                    metadata: {
                        $mergeObjects: [
                            {
                                $ifNull: [
                                    { $arrayElemAt: ['$metadata', 0] },
                                    { count: 0 }
                                ]
                            },
                            {
                                nextPageParams: {
                                    $cond: {
                                        if: {
                                            $gt: [
                                                {
                                                    $arrayElemAt: [
                                                        '$metadata.count',
                                                        0
                                                    ]
                                                },
                                                { $size: '$results' }
                                            ]
                                        },
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
        ]
    );
    return pipeline;
}

module.exports = getAggregationPipeline;
