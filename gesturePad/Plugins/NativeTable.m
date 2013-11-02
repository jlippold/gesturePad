//
//  NativeTable.m
//  NativeTableExample
//
//  Created by Spartak B
//  Copyright (c) 2011 Develocorp Inc. All rights reserved.
//

#import "NativeTable.h"
#import "Base64.h"
#import <QuartzCore/QuartzCore.h>

@implementation NativeTable;
@synthesize mainTableView = _mainTableView;
@synthesize searchBar = _searchBar;
@synthesize searchController = _searchController;
@synthesize managedObjectContext = _managedObjectContext;
@synthesize navBar = _navbar;
@synthesize toolBar = _toolbar;

static dispatch_queue_t concurrentQueue = NULL;


-(CDVPlugin*) initWithWebView:(UIWebView*)theWebView
{
    
    self = (NativeTable*)[super initWithWebView:theWebView];
    return self;
}

- (void)dealloc
{

	[_mainTableView release];
	[_mainTableData release];
    [_searchBar release];
    [_searchController release];
    [_navbar release];
    [_toolbar release];
    [_searchResults release];
    [super dealloc];
}



#pragma mark - JS interface methods

-(BOOL)isIOS7 {
    BOOL iOS7 = YES;
    if (floor(NSFoundationVersionNumber) <= NSFoundationVersionNumber_iOS_6_1) {
        iOS7 = NO;
    }
    return iOS7;
}

- (void)createTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
    CGRect navBarFrame = CGRectMake(0, 0, self.webView.superview.bounds.size.width, 44.0);
    if ([self isIOS7]) {
        navBarFrame = CGRectMake(0, 10, self.webView.superview.bounds.size.width, 44.0);
    }

    _navbar = [[UINavigationBar alloc] initWithFrame:navBarFrame];

    UIImage *backgroundImage = [UIImage imageNamed:@"www/img/navBar.png"];
    [_navbar setBackgroundImage:backgroundImage forBarMetrics:0];
    _navbar.barStyle = UIBarStyleBlack;
    if ([self isIOS7]) {
        _navbar.tintColor = [UIColor whiteColor];
    }

    

    
    UINavigationItem *navItem = [UINavigationItem alloc];
    NSString *navTitle = @"";
    navTitle = [options objectForKey:@"navTitle"];
    navItem.title = navTitle;
    
    if ( [[options objectForKey:@"showRightButton"] boolValue] == true) {
        NSString *RightButtonTitle = [options objectForKey:@"RightButtonText"];
        
        UIBarButtonItem *rightButton = [[UIBarButtonItem alloc] initWithTitle:RightButtonTitle
                                                                        style:UIBarButtonItemStyleDone
                                                                       target:self
                                                                       action:@selector(onRightButtonPress:) ];
        navItem.rightBarButtonItem = rightButton;
        [rightButton release];
    }
    
    if ( [[options objectForKey:@"showBackButton"] boolValue] == true) {
        
        NSString *backArrowString = @"\U000025C0\U0000FE0E"; //BLACK LEFT-POINTING TRIANGLE PLUS VARIATION SELECTOR
        
        UIBarButtonItem *backBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:backArrowString style:UIBarButtonItemStylePlain target:self action:@selector(onBackButtonPress:)];
        navItem.leftBarButtonItem = backBarButtonItem;
        [backBarButtonItem release];
        
    }
    
    _mainTableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    
    [_navbar pushNavigationItem:navItem animated:false];
    [self.webView.superview addSubview:_navbar];
    [_navbar setHidden:YES];
    _offsetTop = 0.0f;
    _offsetBottom = 0.0f;


    _toolbar = [[UIToolbar alloc] init];
    [_toolbar setHidden:YES];
    [_toolbar setBackgroundImage:backgroundImage forToolbarPosition:0 barMetrics:0];
    _toolbar.barStyle = UIBarStyleBlack;
    if ([self isIOS7]) {
        _toolbar.tintColor = [UIColor whiteColor];
    }
    
    if ( [[options objectForKey:@"showToolBar"] boolValue] == true) {
        [_toolbar setHidden:NO];
        
        CGRect toolBarFrame = CGRectMake(0, self.webView.superview.bounds.size.height - 44.0, self.webView.superview.bounds.size.width, 44.0);
        if ([self isIOS7]) {
            toolBarFrame = CGRectMake(0, self.webView.superview.bounds.size.height - 54.0, self.webView.superview.bounds.size.width, 44.0);
        }
        _toolbar.frame = toolBarFrame;
        [_toolbar sizeToFit];
        UIBarButtonItem *flexItem = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemFlexibleSpace
                                                                                  target:nil
                                                                                  action:nil];

        UIBarButtonItem *buttonOne = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Reply.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonOnePress:)];
        
        if ( [[options objectForKey:@"MediaBrowserToolBar"] boolValue] == true) {
            buttonOne = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Shuffle.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonOnePress:)];
        }

        UIBarButtonItem *buttonTwo = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/SpeakerDown.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonTwoPress:)];
        
        UIBarButtonItem *buttonThree = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/SpeakerUp.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonThreePress:)];
        
        UIBarButtonItem *buttonFour = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Action.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonFourPress:)];
        
        UIBarButtonItem *buttonFive = [[UIBarButtonItem alloc] initWithImage:[UIImage imageNamed:@"www/img/toolbarButtons/Refresh.png"] style:UIBarButtonItemStylePlain target:self action:@selector(onButtonFivePress:)];
        
        NSArray *items = [NSArray arrayWithObjects: buttonOne, flexItem, buttonTwo, flexItem, buttonThree, flexItem, buttonFour, flexItem, buttonFive, nil];
        [_toolbar setItems: items animated:NO];
        [self.webView.superview addSubview:_toolbar];
        [buttonOne release];
        [buttonTwo release];
        [buttonThree release];
        [buttonFour release];
        [buttonFive release];
        [flexItem release];
        
        
        
    }

    
	[_mainTableView release];
	_mainTableView = [UITableView new];
	[_mainTableView setHidden:YES];
	[_mainTableView setDataSource:self];
	[_mainTableView setDelegate:self];
    
    if ([self isIOS7]) {
        _mainTableHeight =  [[UIScreen mainScreen] bounds].size.height-10;
    } else {
        _mainTableHeight =  [[options objectForKey:@"height"] floatValue];
    }

    
    UIView *backgroundView = [[UIView alloc] initWithFrame:_mainTableView.bounds];
    backgroundView.backgroundColor = [UIColor clearColor];
    _mainTableView.backgroundView = backgroundView;
    
    if ([_mainTableView respondsToSelector:@selector(setSeparatorInset:)]) {
        [_mainTableView setSeparatorInset:UIEdgeInsetsZero];
        //[_mainTableView setSeparatorInset:UIEdgeInsetsMake(10, 10, 0, 0)];
    }
    
    if ( [[options objectForKey:@"showSearchBar"] boolValue] == true) {
        [self setupSearchBar];
    }
    if ( [[options objectForKey:@"showNavBar"] boolValue] == true) {
        [_navbar setHidden:NO];
        if ([self isIOS7]) {
            _offsetTop = 54.0f;
        } else {
            _offsetTop = _navbar.frame.size.height;
        }
    }
    
    if ( [[options objectForKey:@"showToolBar"] boolValue] == true) {
        [_toolbar setHidden:NO];
        if ([self isIOS7]) {
            _offsetBottom = 44.0f;
        } else {
            _offsetBottom = _toolbar.frame.size.height;
        }
    }
    
    _searchResults = [NSMutableArray array];
	self.webView.superview.autoresizesSubviews = YES;
	[self.webView.superview addSubview:_mainTableView];
    
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 60;
}

- (IBAction)onRightButtonPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onRightButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)onBackButtonPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onBackButtonTap();";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}

- (IBAction)onButtonOnePress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(1);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonTwoPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(2);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonThreePress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(3);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonFourPress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(4);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}
- (IBAction)onButtonFivePress:(id)sender
{
    NSString * jsCallBack = @"window.plugins.NativeTable._onToolbarButtonClick(5);";
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}


- (void)setTableData:(NSArray*)arguments withDict:(NSDictionary*)options
{
	
	[_mainTableData release];
	_mainTableData = [[arguments objectAtIndex:0] copy];
	[_mainTableView reloadData];
	
}


- (void)setupSearchBar {
    
    _searchBar = [[UISearchBar alloc] initWithFrame:CGRectMake(0, 0, _mainTableView.frame.size.width, 44) ];
    _searchBar.delegate = self;
    _searchBar.showsCancelButton = YES;
    self.mainTableView.tableHeaderView = _searchBar;

    _searchController = [[UISearchDisplayController alloc] initWithSearchBar:_searchBar  contentsController:self.viewController ];
    _searchController.searchResultsDataSource = self;
    _searchController.searchResultsDelegate = self;
    _searchController.delegate = self;
    
    if ([self isIOS7]) {
        _searchBar.searchBarStyle = UISearchBarStyleProminent;
        _searchBar.tintColor = [UIColor blackColor];
    }
    
}

- (void)searchBarTextDidBeginEditing:(UISearchBar *)theSearchBar {

    if ([self isIOS7]) {
        theSearchBar.backgroundColor = [UIColor blackColor];
        //[[theSearchBar.subviews objectAtIndex:0] removeFromSuperview];
        [theSearchBar setTranslucent:NO];
        
        //theSearchBar.searchBarStyle
        CGRect mainTableFrame = CGRectMake(
                                    _originalWebViewFrame.origin.x,
                                    20,
                                    _originalWebViewFrame.size.width,
                                    _originalWebViewFrame.size.height
                                    );
        
        [_mainTableView setFrame:mainTableFrame];
    }
}

- (UIBarPosition)positionForBar:(id <UIBarPositioning>)bar
{
    return UIBarPositionTopAttached;
}

-(void) searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText {
    if ([self isIOS7]) {
        CGRect mainTableFrame = CGRectMake(
                                           _originalWebViewFrame.origin.x,
                                           20,
                                           _originalWebViewFrame.size.width,
                                           _originalWebViewFrame.size.height
                                           );
        
        [_mainTableView setFrame:mainTableFrame];
    }
    
}
- (void)searchBarTextDidEndEditing:(UISearchBar *)theSearchBar {
    if ([self isIOS7]) {
        CGRect mainTableFrame = CGRectMake(
                                           _originalWebViewFrame.origin.x,
                                           54,
                                           _originalWebViewFrame.size.width,
                                           _mainTableHeight-_offsetTop-_offsetBottom
                                           );
        
        [_mainTableView setFrame:mainTableFrame];
    }
    
    isFiltered = YES;
    if (_searchBar.text.length == 0) {
        isFiltered = NO;
    } else {
        
        [self filterForTerm:_searchBar.text];
    }
    [_mainTableView reloadData];
}
- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar {
    searchBar.text=@"";
    [searchBar setShowsCancelButton:NO animated:YES];
    [searchBar resignFirstResponder];
}

- (BOOL)searchDisplayController:(UISearchDisplayController *)controller shouldReloadTableForSearchString:(NSString *)searchString {
    if (searchString.length == 0)
        isFiltered = NO;
    else
        isFiltered = YES;
    [self filterForTerm:searchString];
    [_mainTableView reloadData];
    return YES;
}

- (void)filterForTerm:(NSString *)term {
    NSMutableArray *results = [[NSMutableArray alloc] init];
    
    for(int i = 0; i < [_mainTableData count]; i++ ) {
        NSRange range = [[[_mainTableData objectAtIndex:i] valueForKey:@"textLabel"] rangeOfString:term options:NSCaseInsensitiveSearch];
        NSRange range2 = [[[_mainTableData objectAtIndex:i] valueForKey:@"detailTextLabel"] rangeOfString:term options:NSCaseInsensitiveSearch];
        if (range.location != NSNotFound || range2.location != NSNotFound  ) {
            [[_mainTableData objectAtIndex:i] setObject:[NSString stringWithFormat:@"%d", i] forKey:@"index"];
            [results addObject: [_mainTableData objectAtIndex:i]];
        }
    }
    
    _searchResults = results.copy;
    [_mainTableView reloadData];
}

- (void)showTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
	if(nil == _mainTableView){
        [self createTable:nil withDict:nil];
        
        UIView *backgroundView = [[UIView alloc] initWithFrame:_mainTableView.bounds];
        backgroundView.backgroundColor = [UIColor blackColor];
        _mainTableView.backgroundView = backgroundView;
        
	}
	
	if(NO == [_mainTableView isHidden]){
		return;
	}
    
    [self disableScrollsToTopPropertyOnAllSubviewsOf:self.webView ];
    
	_mainTableView.scrollsToTop = YES;
    
	_originalWebViewFrame = self.webView.frame;
	
	CGRect CDWebViewFrame;
	
	CDWebViewFrame = CGRectMake(
                                _originalWebViewFrame.origin.x,
                                _originalWebViewFrame.origin.y,
                                _originalWebViewFrame.size.width,
                                _originalWebViewFrame.size.height - _mainTableHeight
                                );
	
	_mainTableFrame = CGRectMake(
                                CDWebViewFrame.origin.x,
                                CDWebViewFrame.origin.y + (CDWebViewFrame.size.height + _offsetTop + _offsetBottom),
                                CDWebViewFrame.size.width,
                                _mainTableHeight-_offsetTop-_offsetBottom
                                );
	
    [self.webView setFrame:CDWebViewFrame];
	[_mainTableView setFrame:_mainTableFrame];
	[_mainTableView setHidden:NO];


    [self fadeIn];
    
	//NSLog(@"ShowTable Called!");
    
}


- (void)scrollTo:(NSArray*)arguments withDict:(NSDictionary*)options
{
    //requested position
    if ( [[options objectForKey:@"index"] floatValue] ) {
        int actualRow = [[options objectForKey:@"index"] floatValue];
        if (actualRow < 1) {
            return;
        }
        
        //lookup Row and Section
        int section = -1;
        int row = 0;
        int counter = 0;
        
        NSMutableArray *tmp = [[NSMutableArray alloc] init];
        if (isFiltered) {
            tmp = _searchResults.copy;
        } else {
            tmp = _mainTableData.copy;
        }
        
        NSString *loopedHeader = @"";
        
        for(int i = 0; i < [tmp count]; i++ ) {
            
            NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
            if ( ![thisHeader isEqualToString:loopedHeader]) {
                loopedHeader = thisHeader;
                section++;
                row = 0;
            }
            
            if (counter == actualRow) {
                break;
            }
            
            counter++;
            row++;
        }
        [tmp release];
        
        
        //scroll to item
        //NSLog(@" Section %d Row %d", section, row   );
        
        [_mainTableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:row inSection:section]
                              atScrollPosition:UITableViewScrollPositionMiddle animated:YES];
        
    }


}

- (void)hideTable:(NSArray*)arguments withDict:(NSDictionary*)options
{
    //    [self searchBarCancelButtonClicked:_searchBar];
    
	if(nil == _mainTableView){
        return;
	}
	
	if(YES == [_mainTableView isHidden]){
		return;
	}
    
    if (concurrentQueue) {
       dispatch_release(concurrentQueue);
    }
    
    [_searchBar resignFirstResponder];
    
    
    [self fadeOut];
	
	[self.webView setFrame:_originalWebViewFrame];
    
	
}


#pragma mark - tableView delegate and datasource methods
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = 1;
    
    if ([tmp count] == 0) {
        return 0;
    }
    NSString *loopedHeader = [[tmp objectAtIndex:0] valueForKey:@"sectionHeader"];
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            counter++;
        }
    }
    // NSLog(@"Total Sections: %d", counter);
    [tmp release];
    return counter;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    //return isFiltered ? _searchResults.count : _mainTableData.count;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = 0;
    int rowsInSection = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            rowsInSection++;
        }
    }
    //    NSLog(@"Section: %d Count: %d", section, rowsInSection);
    [tmp release];
    return rowsInSection;
    
}

- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section {
    // NSLog(@"Requesting: %d", section);
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    int counter = -1;
    NSString *loopedHeader = @"";
    NSString *retVal = @"";
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            counter++;
        }
        if (section == counter) {
            retVal = [NSString stringWithFormat:@"   %@", thisHeader] ;
        }
    }
    
    [tmp release];
    return retVal;
    
}

-(void)tableView:(UITableView*)tableView willDisplayCell:(UITableViewCell*)cell forRowAtIndexPath:(NSIndexPath*)indexPath;
{

    static UIImage* bgImage = nil;
    if (bgImage == nil) {
        bgImage = [[UIImage imageNamed:@"www/img/TableViewBG1.png"] retain];
    }
    static UIImage* bgImage2 = nil;
    if (bgImage2 == nil) {
        bgImage2 = [[UIImage imageNamed:@"www/img/TableViewBG2.png"] retain];
    }
    
    if( [indexPath row] % 2)
        cell.backgroundView = [[[UIImageView alloc] initWithImage:bgImage] autorelease];
    else
        cell.backgroundView = [[[UIImageView alloc] initWithImage:bgImage2] autorelease];

    
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier];
    if (cell == nil) {
        cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:CellIdentifier] autorelease];
    }
	int section = indexPath.section;
    int row = indexPath.row;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    
    int counter = 0;
    int rowCounter = 0;
    int sectionRowCounter = 0;
    int actualRow = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            if (sectionRowCounter == row ) {
                actualRow = rowCounter;
            }
            sectionRowCounter++;
        }
        rowCounter++;
    }
    //    NSLog(@"Section: %d Count: %d", section, rowsInSection);
    [tmp release];
    
    NSDictionary *item = [_mainTableData objectAtIndex:actualRow];
    if (isFiltered) {
        item = [_searchResults objectAtIndex:actualRow];
    }
    
    cell.textLabel.text = [item valueForKey:@"textLabel"];
    
	cell.textLabel.textColor = [UIColor colorWithRed:0.302 green:0.302 blue:0.302 alpha:1];
	cell.textLabel.font = [UIFont boldSystemFontOfSize:15.0f];
    cell.textLabel.shadowColor = [UIColor whiteColor];
    cell.textLabel.shadowOffset = CGSizeMake(0.0, 1.0);
    cell.textLabel.backgroundColor = [UIColor clearColor];
    
    cell.detailTextLabel.text = [item valueForKey:@"detailTextLabel"];

	cell.detailTextLabel.textColor = [UIColor colorWithRed:0.592 green:0.592 blue:0.592 alpha:1];
	cell.detailTextLabel.font = [UIFont systemFontOfSize:12];
    cell.detailTextLabel.shadowColor = [UIColor whiteColor];
    cell.detailTextLabel.shadowOffset = CGSizeMake(0.0, 1.0);
    cell.detailTextLabel.backgroundColor = [UIColor clearColor];
    
    cell.detailTextLabel.numberOfLines = 2;
    
    NSString *icon = [item valueForKey:@"icon"];
    
    if ([icon isEqualToString:@"none"]) {
        cell.accessoryType = UITableViewCellAccessoryNone;
    } else if ([icon isEqualToString:@"greyarrow"]) {
        cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
    } else if ([icon isEqualToString:@"bluearrow"]) {
        cell.accessoryType = UITableViewCellAccessoryDetailDisclosureButton;
    } else {
        cell.accessoryType = UITableViewCellAccessoryNone;
    }
    
    
    if ([item valueForKey:@"image"]) {
        
        NSString *url = [item valueForKey:@"image"];
        cell.indentationLevel = 1;
        cell.indentationWidth = 2;
        
        
        if (![url hasPrefix:@"http"]) {
            cell.imageView.contentMode = UIViewContentModeScaleAspectFill;
            cell.imageView.image = [self resizeImageToSize:[UIImage imageNamed:url]];
            if (![item valueForKey:@"nomask"]) {
                cell.imageView.backgroundColor = [UIColor blackColor];
                cell.imageView.layer.masksToBounds = YES;
                cell.imageView.layer.cornerRadius = 5.0;
            }
            [cell setNeedsLayout];
        } else {
            
            //check if the cached version exists
            NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory,  NSUserDomainMask, YES);
            NSString *documentsDirectory = [paths objectAtIndex:0];
            NSString *cachedFile = [documentsDirectory stringByAppendingPathComponent:[NSString stringWithFormat:@"MB_Small_%@.cache", [item valueForKey:@"guid"] ]];
            
            BOOL fileExists = [[NSFileManager defaultManager] fileExistsAtPath:cachedFile];
            if (fileExists) {
                NSString *content = [NSString stringWithContentsOfFile:cachedFile encoding:NSUTF8StringEncoding error:nil];
                NSURL *url = [NSURL URLWithString:content];
                NSData *imageData = [NSData dataWithContentsOfURL:url];
                cell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                cell.imageView.image = [self resizeImageToSize:[UIImage imageWithData:imageData]];
                if (![item valueForKey:@"nomask"]) {
                    cell.imageView.layer.masksToBounds = YES;
                    cell.imageView.layer.cornerRadius = 5.0;
                    cell.imageView.layer.borderColor = [UIColor blackColor].CGColor;
                    cell.imageView.layer.borderWidth = 1.0;
                }
                [cell setNeedsLayout];
            } else {
                dispatch_queue_t concurrentQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH,  0ul);
                dispatch_async(concurrentQueue, ^{
                    NSData *image = [[NSData alloc] initWithContentsOfURL:[[NSURL alloc] initWithString:url]];
                    NSData* data = UIImagePNGRepresentation([UIImage imageWithData:image]);
                    [Base64 initialize];
                    NSString *strEncoded = [Base64 encode:data];
                    if (![strEncoded isEqualToString:@""]) {
                        strEncoded = [@"data:image/png;base64," stringByAppendingString:strEncoded];
                        [strEncoded writeToFile:cachedFile atomically:YES encoding:NSUTF8StringEncoding error:nil];
                    }
                    [Base64 release];
                    dispatch_sync(dispatch_get_main_queue(), ^{
                        UITableViewCell *nCell = [tableView cellForRowAtIndexPath:indexPath];
                        if ([[NSFileManager defaultManager] fileExistsAtPath:cachedFile]){
                            NSString *content = [NSString stringWithContentsOfFile:cachedFile encoding:NSUTF8StringEncoding error:nil];
                            NSURL *url = [NSURL URLWithString:content];
                            NSData *imageData = [NSData dataWithContentsOfURL:url];
                            nCell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                            nCell.imageView.image = [self resizeImageToSize:[UIImage imageWithData:imageData]];
                            if (![item valueForKey:@"nomask"]) {
                                nCell.imageView.layer.masksToBounds = YES;
                                nCell.imageView.layer.cornerRadius = 5.0;
                                nCell.imageView.layer.borderColor = [UIColor blackColor].CGColor;
                                nCell.imageView.layer.borderWidth = 1.0;
                            }

                            [nCell setNeedsLayout];
                        } else {
                            nCell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                            nCell.imageView.image = [self resizeImageToSize:[UIImage imageNamed:@"www/img/mb.png"]];
                            [nCell setNeedsLayout];
                        }
                    });
                });
                cell.imageView.contentMode = UIViewContentModeScaleAspectFit;
                cell.imageView.image = [self resizeImageToSize:[UIImage imageNamed:@"www/img/mb.png"]];
                [cell setNeedsLayout];
            }
        }
    }

    
     return cell;
}


- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
                
	int section = indexPath.section;
    int row = indexPath.row;
    
    NSMutableArray *tmp = [[NSMutableArray alloc] init];
    if (isFiltered) {
        tmp = _searchResults.copy;
    } else {
        tmp = _mainTableData.copy;
    }
    
    int counter = 0;
    int rowCounter = 0;
    int sectionRowCounter = 0;
    int actualRow = 0;
    NSString *loopedHeader = @"";
    BOOL isCurrentSection = false;
    
    for(int i = 0; i < [tmp count]; i++ ) {
        NSString *thisHeader = [[tmp objectAtIndex:i] valueForKey:@"sectionHeader"];
        if ( ![thisHeader isEqualToString:loopedHeader]) {
            loopedHeader = thisHeader;
            isCurrentSection = false;
            if (counter == section) {
                isCurrentSection = true;
            }
            counter++;
        }
        
        if (isCurrentSection) {
            if (sectionRowCounter == row ) {
                actualRow = rowCounter;
                if (isFiltered) {
                    //we have the searched item, but we need to pull the original index
                    actualRow = [[[tmp objectAtIndex:i] objectForKey:@"index"] intValue];
                }
            }
            sectionRowCounter++;
        }
        rowCounter++;
    }
    [tmp release];
    
    NSString * jsCallBack = [NSString stringWithFormat:@"window.plugins.NativeTable._onTableViewRowSelect(%d);", actualRow];
    [self.webView stringByEvaluatingJavaScriptFromString:jsCallBack];
}


-(void)fadeIn
{
    CGRect r = [_mainTableView frame];
    r.origin.y = [_mainTableView frame].size.height;
    [_mainTableView setFrame:r];
    _mainTableView.alpha = 0;
    _navbar.alpha = 0;
    _toolbar.alpha = 0;
    [_navbar setHidden:NO];
    [_toolbar setHidden:NO];
    [_mainTableView setHidden:NO];
    
    [UIView animateWithDuration:0.3
                          delay: 0.0
                        options:UIViewAnimationCurveEaseInOut
                     animations:^{
                         CGRect r = [_mainTableView frame];
                         r.origin.y = _offsetTop;
                         [_mainTableView setFrame:r];
                         _mainTableView.alpha = 1;
                         _navbar.alpha =1 ;
                         _toolbar.alpha =1 ;
                     }
                     completion:^(BOOL finished){
                         [self.webView stringByEvaluatingJavaScriptFromString:@"window.plugins.NativeTable._onTableShowComplete();"];
                     }];
    
}

- (void) removeDim {
    [[self.webView.superview.subviews lastObject] setHidden:YES];
}

-(void)fadeOut
{
    
    
    CGRect r = [_mainTableView frame];
    r.origin.y = _offsetTop;
    [_mainTableView setFrame:r];
    _mainTableView.alpha = 1;
    _navbar.alpha = 1;
    _toolbar.alpha = 1;
    [_navbar setHidden:NO];
    [_toolbar setHidden:NO];
    [_mainTableView setHidden:NO];
    
    [UIView animateWithDuration:0.3
                          delay: 0.0
                        options:UIViewAnimationCurveEaseInOut
                     animations:^{
                         CGRect r = [_mainTableView frame];
                         r.origin.y = [_mainTableView frame].size.height;
                         [_mainTableView setFrame:r];
                         _mainTableView.alpha = 0;
                         _navbar.alpha = 0;
                         _toolbar.alpha = 0;
                     }
                     completion:^(BOOL finished){
                         [self searchBarCancelButtonClicked:_searchBar];

                         [_navbar setHidden:YES];
                         [_toolbar setHidden:YES];
                         [_mainTableView setHidden:YES];
                        [self removeDim];
                         [self.webView stringByEvaluatingJavaScriptFromString:@"window.plugins.NativeTable._onTableHideComplete();"];
                         
                     }];
    
    
}

- (UIImage *)resizeImageToSize:(UIImage*)image
{
    int boxSize = 50;
    UIGraphicsBeginImageContextWithOptions(CGSizeMake(boxSize, boxSize), NO, [[UIScreen mainScreen] scale]);
    [image drawInRect:CGRectMake(0, 0, boxSize, boxSize)];
    UIImage *imageAfterResize = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return imageAfterResize ;
}

- (void) disableScrollsToTopPropertyOnAllSubviewsOf:(UIView *)view {
    for (UIView *subview in view.subviews) {
        if ([subview isKindOfClass:[UIScrollView class]]) {
            ((UIScrollView *)subview).scrollsToTop = NO;
        }
        [self disableScrollsToTopPropertyOnAllSubviewsOf:subview];
    }
}

@end
